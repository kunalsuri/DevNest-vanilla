import { Express, Request, Response, static as expressStatic } from "express";
import multer from "multer";
import { validateAccessToken, validateCSRF } from "./auth/auth-middleware";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import logger from "./logger";
import { userService } from "./services";
import {
  validateProfileUpdate,
  handleValidationErrors,
} from "./middleware/validation";

// Allowed image extensions (independent of MIME type)
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
]);

// Magic bytes for supported image formats
const IMAGE_MAGIC_BYTES: Array<{ bytes: number[]; offset: number }> = [
  { bytes: [0xff, 0xd8, 0xff], offset: 0 }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 }, // PNG
  { bytes: [0x47, 0x49, 0x46], offset: 0 }, // GIF
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // WEBP (RIFF header)
];

async function hasValidImageSignature(filePath: string): Promise<boolean> {
  const buffer = Buffer.alloc(12);
  let fd: fs.FileHandle | undefined;
  try {
    fd = await fs.open(filePath, "r");
    await fd.read(buffer, 0, 12, 0);
    return IMAGE_MAGIC_BYTES.some(({ bytes, offset }) =>
      bytes.every((b, i) => buffer[offset + i] === b),
    );
  } catch {
    return false;
  } finally {
    await fd?.close();
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/profile-pictures";
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch((err) => cb(err, uploadDir));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      // Use a fully opaque UUID filename to prevent user ID enumeration
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      file.mimetype.startsWith("image/") &&
      ALLOWED_IMAGE_EXTENSIONS.has(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed"));
    }
  },
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

export function setupProfile(app: Express) {
  /**
   * @swagger
   * /profile:
   *   get:
   *     summary: Get user profile
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  // Get user profile
  app.get("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const user = await userService.getUserById(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      logger.error("Profile fetch error", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.jwtUser?.userId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.put(
    "/api/profile",
    validateAccessToken,
    validateCSRF,
    validateProfileUpdate,
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const validatedData = profileUpdateSchema.parse(req.body);
        const updatedUser = await userService.updateUser(
          req.jwtUser!.userId,
          validatedData,
        );
        res.json(updatedUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation failed", errors: error.issues });
        }
        if (error instanceof Error && error.message === "Email already taken") {
          return res.status(400).json({ message: error.message });
        }
        if (error instanceof Error && error.message === "User not found") {
          return res.status(404).json({ message: error.message });
        }
        logger.error("Profile update error", {
          error: error instanceof Error ? error.message : String(error),
          userId: req.jwtUser?.userId,
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Upload profile picture (with auth guard before multer)
  app.post(
    "/api/profile/upload-picture",
    validateAccessToken,
    validateCSRF,
    async (req, res, next) => {
      upload.single("profilePicture")(req, res, next);
    },
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Validate file content signature (magic bytes) to guard against spoofed MIME types
        const validSignature = await hasValidImageSignature(req.file.path);
        if (!validSignature) {
          await fs.unlink(req.file.path).catch(() => undefined);
          return res
            .status(400)
            .json({ message: "Invalid image file content" });
        }

        const updatedUser = await userService.updateProfilePicture(
          req.jwtUser!.userId,
          req.file.path,
        );
        res.json({ profilePicture: updatedUser.profilePicture });
      } catch (error) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => undefined);
        }
        logger.error("Profile picture upload error", {
          error: error instanceof Error ? error.message : String(error),
          userId: req.jwtUser?.userId,
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete user account
  app.delete(
    "/api/profile",
    validateAccessToken,
    validateCSRF,
    async (req, res) => {
      try {
        await userService.deleteUser(req.jwtUser!.userId);

        // Revoke all user sessions
        if (req.sessionId) {
          const { sessionManager } = await import("./auth/session-manager");
          await sessionManager.revokeSession(req.sessionId);
        }

        res.json({ message: "Account deleted successfully" });
      } catch (error) {
        if (error instanceof Error && error.message === "User not found") {
          return res.status(404).json({ message: error.message });
        }
        logger.error("Account deletion error", {
          error: error instanceof Error ? error.message : String(error),
          userId: req.jwtUser?.userId,
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Get user preferences
  app.get("/api/profile/preferences", validateAccessToken, async (req, res) => {
    try {
      const preferences = await userService.getUserPreferences(
        req.jwtUser!.userId,
      );
      res.json(preferences);
    } catch (error) {
      logger.error("Get preferences error", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.jwtUser?.userId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user preferences
  app.put(
    "/api/profile/preferences",
    validateAccessToken,
    validateCSRF,
    async (req, res) => {
      try {
        const preferences = await userService.updateUserPreferences(
          req.jwtUser!.userId,
          req.body,
        );
        res.json(preferences);
      } catch (error) {
        logger.error("Update preferences error", {
          error: error instanceof Error ? error.message : String(error),
          userId: req.jwtUser?.userId,
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Serve uploaded profile pictures
  app.use("/uploads", expressStatic("uploads"));
}

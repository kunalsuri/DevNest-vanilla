import { Express, Request, Response, static as expressStatic } from "express";
import multer from "multer";
import { storage } from "./storage";
import { validateAccessToken } from "./auth/auth-middleware";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import logger from "./logger";
import {
  validateProfileUpdate,
  handleValidationErrors,
} from "./middleware/validation";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/profile-pictures";
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch((err) => cb(err, uploadDir));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const jwtReq = req as Request & { jwtUser?: { userId: string } };
      const filename = `${jwtReq.jwtUser?.userId || "unknown"}_${Date.now()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

export function setupProfile(app: Express) {
  // Get user profile
  app.get("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...publicUser } = user;
      res.json(publicUser);
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
    validateProfileUpdate,
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const currentUser = await storage.getUser(req.jwtUser!.userId);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const validatedData = profileUpdateSchema.parse(req.body);

        // Check if email is already taken by another user
        if (validatedData.email && validatedData.email !== currentUser.email) {
          const existingUser = await storage.getUserByEmail(
            validatedData.email,
          );
          if (existingUser && existingUser.id !== currentUser.id) {
            return res.status(400).json({ message: "Email already taken" });
          }
        }

        const updatedUser = await storage.updateUser(
          currentUser.id,
          validatedData,
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const { password, ...publicUser } = updatedUser;
        res.json(publicUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
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
    async (req, res, next) => {
      // Now proceed with multer
      upload.single("profilePicture")(req, res, next);
    },
    async (req, res) => {
      try {
        const user = await storage.getUser(req.jwtUser!.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
          try {
            await fs.unlink(user.profilePicture);
          } catch (error: any) {
            // Log but don't fail if file doesn't exist
            if (error.code !== "ENOENT") {
              logger.warn("Failed to delete old profile picture", {
                error: error.message,
                path: user.profilePicture,
              });
            }
          }
        }

        const profilePicturePath = req.file.path;
        const updatedUser = await storage.updateUser(user.id, {
          profilePicture: profilePicturePath,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ profilePicture: profilePicturePath });
      } catch (error) {
        logger.error("Profile picture upload error", {
          error: error instanceof Error ? error.message : String(error),
          userId: req.jwtUser?.userId,
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete user account
  app.delete("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete profile picture if exists
      if (user.profilePicture) {
        try {
          await fs.unlink(user.profilePicture);
        } catch (error: any) {
          // Log but don't fail if file doesn't exist
          if (error.code !== "ENOENT") {
            logger.warn(
              "Failed to delete profile picture during account deletion",
              {
                error: error.message,
                path: user.profilePicture,
              },
            );
          }
        }
      }

      await storage.deleteUser(user.id);

      // Revoke all user sessions
      if (req.sessionId) {
        const { sessionManager } = await import("./auth/session-manager");
        await sessionManager.revokeSession(req.sessionId);
      }

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      logger.error("Account deletion error", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.jwtUser?.userId,
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user preferences
  app.get("/api/profile/preferences", validateAccessToken, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.jwtUser!.userId);
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
  app.put("/api/profile/preferences", validateAccessToken, async (req, res) => {
    try {
      const preferences = await storage.updateUserPreferences(
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
  });

  // Serve uploaded profile pictures
  app.use("/uploads", expressStatic("uploads"));
}

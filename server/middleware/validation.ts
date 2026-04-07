/**
 * Express Validator Middleware
 *
 * Provides input validation and sanitization using express-validator.
 * Implements comprehensive validation rules for all API endpoints.
 *
 * Features:
 * - Request body validation
 * - Input sanitization (trim, escape, normalize)
 * - Custom validation rules
 * - Detailed error messages
 * - Type-safe validation chains
 */

import { body, validationResult, ValidationChain } from "express-validator";
import { Request, Response, NextFunction } from "express";
import logger from "../logger";

/**
 * Middleware to handle validation errors
 *
 * Checks validation results and returns 400 with detailed errors if validation fails.
 * Logs validation failures for security monitoring.
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: "field" in err ? err.field : "unknown",
      message: err.msg,
      value: "value" in err ? err.value : undefined,
    }));

    logger.warn("Request validation failed", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      errors: errorDetails,
    });

    res.status(400).json({
      message: "Validation error",
      code: "VALIDATION_ERROR",
      errors: errorDetails,
    });
    return;
  }

  next();
}

/**
 * Validation rules for user registration
 */
export const validateRegister: ValidationChain[] = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens",
    )
    .notEmpty()
    .withMessage("Username is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters")
    .notEmpty()
    .withMessage("Email is required"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .notEmpty()
    .withMessage("Password is required"),

  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .notEmpty()
    .withMessage("First name is required"),

  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .notEmpty()
    .withMessage("Last name is required"),
];

/**
 * Validation rules for user login
 */
export const validateLogin: ValidationChain[] = [
  body("username")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Username must be between 1 and 50 characters")
    .notEmpty()
    .withMessage("Username is required"),

  body("password")
    .isLength({ min: 1, max: 128 })
    .withMessage("Password must be between 1 and 128 characters")
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * Validation rules for profile update
 */
export const validateProfileUpdate: ValidationChain[] = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),

  body("profilePicture")
    .optional()
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Profile picture must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Profile picture URL must not exceed 500 characters"),

  body("age")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 120 })
    .withMessage("Age must be a number between 1 and 120"),

  body("officeLocation")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Office location must not exceed 100 characters"),

  body("position")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Position must not exceed 100 characters"),

  body("department")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters"),

  body("phone")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone number must not exceed 30 characters"),
];

/**
 * Validation rules for password update
 */
export const validatePasswordUpdate: ValidationChain[] = [
  body("currentPassword")
    .isLength({ min: 1, max: 128 })
    .withMessage("Current password is required")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .notEmpty()
    .withMessage("New password is required")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
];

/**
 * Validation rules for password reset request
 */
export const validatePasswordResetRequest: ValidationChain[] = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required"),
];

/**
 * Validation rules for password reset confirmation
 */
export const validatePasswordResetConfirm: ValidationChain[] = [
  body("token")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Reset token is required")
    .notEmpty()
    .withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .notEmpty()
    .withMessage("Password is required"),
];

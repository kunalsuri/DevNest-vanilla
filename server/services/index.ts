/**
 * Services Index
 *
 * Central export point for all business logic services.
 * Implements the service layer pattern (ARCH-003).
 */

export {
  authService,
  type AuthResult,
  type LoginCredentials,
  type RegisterData,
} from "./auth-service";
export {
  userService,
  type CreateUserDTO,
  type UpdateUserDTO,
  type User,
} from "./user-service";
export {
  featureFlagService,
  type FeatureFlag,
  type FeatureFlagContext,
} from "./feature-flag-service";
export { auditLogService, type AuditEntry } from "./audit-log-service";
export { notificationService, type Notification } from "./notification-service";
export {
  subscriptionService,
  type Plan,
  type Subscription,
  PLANS,
} from "./subscription-service";

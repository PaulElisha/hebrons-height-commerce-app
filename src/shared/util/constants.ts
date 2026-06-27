/** @format */

const AUTH_CONSTANTS = {
 REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
 EMAIL_TOKEN_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
 OTP_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
 USER_STATUS: {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DELETED: "deleted",
 },
} as const;

export default AUTH_CONSTANTS;

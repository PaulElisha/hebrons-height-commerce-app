/** @format */

import Env from "@/env.ts";
import AUTH_CONSTANTS from "@util/constants.ts";
import { createSecretKey, KeyObject } from "crypto";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";

export interface JwtPayload extends JWTPayload {
 id: string;
 role: string;
 email?: string;
}

export const SecretKey = createSecretKey(Env.JWT_SECRET, "utf-8");
export const RefreshSecretKey = createSecretKey(Env.REFRESH_SECRET, "utf-8");

export const generateToken = async <T extends JwtPayload>(payload: T) => {
 return new SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(Env.JWT_EXPIRY)
  .sign(SecretKey);
};

export const generateRefreshToken = async <T extends JwtPayload>(
 payload: T,
) => {
 const [refreshToken, refreshTokenExpiry] = await Promise.all([
  new SignJWT(payload)
   .setProtectedHeader({ alg: "HS256" })
   .setIssuedAt()
   .setExpirationTime(Env.REFRESH_EXPIRY)
   .sign(RefreshSecretKey),
  new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS),
 ]);

 return { refreshToken, refreshTokenExpiry };
};

export const generateEmailToken = async () => ({
 emailToken: crypto.randomUUID().toString(),
 emailTokenExpiry: new Date(Date.now() + AUTH_CONSTANTS.EMAIL_TOKEN_EXPIRY_MS),
});

export const generateOtp = async () => ({
 otp: Math.floor(1000 + Math.random() * 9000).toString(),
 otpExpiry: new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRY_MS),
});

export const verifyToken = async (
 token: string,
 tokenSecret: KeyObject,
): Promise<JwtPayload> => {
 const { payload } = await jwtVerify(token, tokenSecret);

 return <JwtPayload>payload;
};

export default {
 generateToken,
 generateRefreshToken,
 generateEmailToken,
 generateOtp,
 verifyToken,
 SecretKey,
 RefreshSecretKey,
};

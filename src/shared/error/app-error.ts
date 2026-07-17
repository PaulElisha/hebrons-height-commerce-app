/** @format */
import type { ErrorCodeType, HttpStatusCodeType } from "@shared/types.ts";
export default class AppError extends Error {
 constructor(
  public message: string,
  public statusCode: HttpStatusCodeType,
  public errorCode: ErrorCodeType,
 ) {
  super(message);
  this.message = message;
  this.statusCode = statusCode;
  this.errorCode = errorCode;
  Error.captureStackTrace(this, this.constructor);
 }
}

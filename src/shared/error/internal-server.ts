/** @format */
import AppError from "@error/app-error.ts";
import type { ErrorCodeType, HttpStatusCodeType } from "@shared/types.ts";

export default class InternalServerError extends AppError {
 constructor(
  public message: string,
  public statusCode: HttpStatusCodeType,
  public errorCode: ErrorCodeType,
 ) {
  super(message, statusCode, errorCode);
 }
}

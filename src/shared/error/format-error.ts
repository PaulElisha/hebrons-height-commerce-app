/** @format */

import HttpStatus from "@shared/enum/http.ts";

import AppError from "./app-error.ts";

export const formatErrorPayload = (err: Error) => {
 if (err instanceof AppError) {
  return {
   status: err.statusCode,
   body: { message: err.message, error: err.errorCode, status: err.statusCode },
  };
 }

 return {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  body: {
   message: "Internal Server error",
   error: err.message || "Unknown error occurred",
   status: "error",
  },
 };
};

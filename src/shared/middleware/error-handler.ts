/** @format */

import HttpStatus from "@enum/http.ts";
import AppError from "@error/app-error.ts";
import type { NextFunction, Request, Response } from "express";
import z from "zod";

const errorHandler = (
 err: Error,
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 if (err instanceof AppError) {
  return res.status(err.statusCode).json({
   message: err.message,
   error: err.errorCode,
    status: "error",
  });
 }

 if (err instanceof z.ZodError) {
  return res.status(400).json({
   error: "Validation failed",
   details: err.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
   })),
  });
 }

 if (err instanceof Error) {
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
   message: "Internal Server error",
   error: err.message || "Unknown error occurred",
   status: "error",
  });
 }

 return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  message: "Unknown error",
  error: "Unknown error occurred",
  status: "error",
 });
};

export default errorHandler;

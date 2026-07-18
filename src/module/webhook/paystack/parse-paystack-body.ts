/** @format */
import ErrorCode from "@shared/enum/error-code.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import HttpStatus from "@shared/enum/http.ts";
import { NextFunction, Request, Response } from "express";

export function parsePaystackBody(req: Request, _res: Response, next: NextFunction) {
 try {
  req.rawBody = req.body.toString("utf8");
  req.body = JSON.parse(req.rawBody);
 } catch {
  return next(new BadRequestException(
   "Invalid JSON payload",
   HttpStatus.BAD_REQUEST,
   ErrorCode.VALIDATION_ERROR,
  ));
 }
 next();
}

/** @format */
import type { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validate = (schema: ZodType) => {
 return (req: Request, res: Response, next: NextFunction) => {
  try {
   const body = schema.parse(req.body);
   Object.assign(req.body, body);
   next();
  } catch (err) {
    next(err);
  }
 };
};

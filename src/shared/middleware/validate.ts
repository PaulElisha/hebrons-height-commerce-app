/** @format */
import type { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type ValidationSource = "body" | "params" | "query";

export const validate = (
 schema: ZodType,
 source: ValidationSource = "body",
) => {
 return (req: Request, res: Response, next: NextFunction) => {
  try {
   const parsed = schema.parse(req[source]);
   Object.assign(req[source], parsed);
   next();
  } catch (err) {
   next(err);
  }
 };
};

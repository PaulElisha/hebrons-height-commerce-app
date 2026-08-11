/** @format */
import type { NextFunction, Request, Response } from "express";

export type AsyncHandler<
 P = unknown,
 ResBody = unknown,
 ReqBody = unknown,
 ReqQuery = unknown,
> = (
 req: Request<P, ResBody, ReqBody, ReqQuery>,
 res: Response,
 next: NextFunction,
) => Promise<void | Response>;

const asyncHandler =
 <P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
  controller: AsyncHandler<P, ResBody, ReqBody, ReqQuery>,
 ) =>
 (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction,
 ) => {
  Promise.resolve(controller(req, res, next)).catch(next);
 };

export default asyncHandler;

/** @format */
import { auth } from "@auth/auth.ts";
import * as APIError from "@shared/error/APIError.ts";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

const authenticate = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 try {
  const session = await auth.api.getSession({
   headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
   throw APIError.unauthorized();
  }

  req.user = session.user;
  req.session = session.session;

  next();
 } catch (err) {
  next(err);
 }
};

export default authenticate;

/** @format */

import { JwtPayload } from "@util/jwt.js";

declare global {
 namespace Express {
  interface Request {
   user: JwtPayload;
  }
 }
}

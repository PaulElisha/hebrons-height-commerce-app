/** @format */
import { APIError, middleware } from "encore.dev/api";
import { RateLimiterMemory } from "rate-limiter-flexible";

import { getAuth } from "./get-auth.ts";
import { AuthData } from "./types.ts";

const opts = {
 points: 1,
 duration: 5,
};

const rateLimiter = new RateLimiterMemory(opts);

export const rateLimit = middleware(
 { target: { auth: true } },
 async (req, next) => {
  const [authdata, error] = getAuth<AuthData>();

  if (error) throw error;

  return rateLimiter
   .consume(authdata?.userID as string)
   .then(async (rateLimiterRes) => {
    const res = await next(req);

    res.header.set(
     "Retry-After",
     (rateLimiterRes.msBeforeNext / 1000).toString(),
    );
    res.header.set("X-RateLimit-Limit", opts.points.toString());
    res.header.set(
     "X-RateLimit-Remaining",
     rateLimiterRes.remainingPoints.toString(),
    );
    res.header.set(
     "X-RateLimit-Reset",
     new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
    );

    return res;
   })
   .catch((e: APIError) => {
    if (e instanceof APIError) throw e;
    throw APIError.resourceExhausted("Too Many Requests");
   });
 },
);

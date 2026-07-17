/** @format */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";
import Env, { isProd } from "@/env.ts";
import { remember } from "@epic-web/remember";
const createPool = () =>
 new Pool({
  connectionString: Env.DB_URL,
  ssl:
   process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
 });

let client;

if (isProd()) {
 client = createPool();
} else {
 client = remember("dbPool", () => createPool());
}

const pool = remember("dbPool", () => createPool());

export default drizzle(pool, { schema });

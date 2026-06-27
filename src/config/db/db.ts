/** @format */

import Env, { isProd } from "@/env.ts";
import { remember } from "@epic-web/remember";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

const createPool = () =>
 new Pool({
  connectionString: Env.DB_URL,
 });

let client;

if (isProd()) {
 client = createPool();
} else {
 client = remember("dbPool", () => createPool());
}

const pool = remember("dbPool", () => createPool());

export default drizzle(pool, { schema });

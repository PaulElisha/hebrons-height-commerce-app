/** @format */

import { remember } from "@epic-web/remember";
import { drizzle } from "drizzle-orm/node-postgres";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Pool } from "pg";

import * as schema from "../../module/auth/schema.ts";
import { Env } from "../../env.ts";

// const sqldb = new SQLDatabase("hhg_database", {
//  migrations: {
//   path: "./migrations",
//   source: "drizzle",
//  },
// });

const createPool = () =>
 new Pool({
  connectionString: Env.DB_URL,
 });

const pool = remember("dbPool", () => createPool());

export const db = drizzle(pool, { schema });

/** @format */

import { remember } from "@epic-web/remember";
import { drizzle } from "drizzle-orm/node-postgres";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Pool } from "pg";

import * as schema from "../../module/auth/schema.ts";

const sqldb = new SQLDatabase("hhg_database", {
 migrations: {
  path: "./migrations",
  source: "drizzle",
 },
});

const createPool = () =>
 new Pool({
  connectionString: sqldb.connectionString,
 });

const pool = remember("dbPool", () => createPool());

export const db = drizzle(pool, { schema });

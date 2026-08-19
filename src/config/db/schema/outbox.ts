/** @format */

import { sql } from "drizzle-orm";
import {
 index,
 integer,
 jsonb,
 pgTable,
 text,
 timestamp,
 uuid,
} from "drizzle-orm/pg-core";

export const outbox = pgTable(
 "outbox",
 {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
 },
 (t) => [
  index("outbox_unprocessed_idx")
   .on(t.processedAt)
   .where(sql`${t.processedAt} IS NULL`),
 ],
);

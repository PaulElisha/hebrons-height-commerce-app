/** @format */

import {
 integer,
 jsonb,
 pgTable,
 text,
 timestamp,
 uuid,
} from "drizzle-orm/pg-core";

export const outbox = pgTable("outbox", {
 id: uuid("id").primaryKey().defaultRandom(),
 eventType: text("event_type").notNull(),
 payload: jsonb("payload").notNull(),
 createdAt: timestamp("created_at").notNull().defaultNow(),
 processedAt: timestamp("processed_at"),
 attempts: integer("attempts").notNull().default(0),
 lastError: text("last_error"),
});

CREATE INDEX "merchant_active_created_idx" ON "merchant" USING btree ("approval_status","created_at") WHERE "merchant"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "order_user_created_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "product_status_category_idx" ON "product" USING btree ("product_status","category") WHERE "product"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "payment_status_created_idx" ON "payment" USING btree ("payment_status","created_at");--> statement-breakpoint
CREATE INDEX "outbox_unprocessed_created_idx" ON "outbox" USING btree ("created_at") WHERE "outbox"."processed_at" IS NULL;
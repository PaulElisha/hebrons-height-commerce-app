CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "user_id" text NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_user_id_user_id_fk') THEN
  ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_user_id_user_id_fk') THEN
  ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_user_id_user_id_fk') THEN
  ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_id_user_id_fk') THEN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cart_id_cart_id_fk') THEN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_product_id_product_id_fk') THEN
  ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_user_id_user_id_fk') THEN
  ALTER TABLE "merchant" ADD CONSTRAINT "merchant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_user_id_fk') THEN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_cart_id_cart_id_fk') THEN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orderItem_order_id_orders_id_fk') THEN
  ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orderItem_merchant_id_merchant_id_fk') THEN
  ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_merchant_id_merchant_id_fk') THEN
  ALTER TABLE "product" ADD CONSTRAINT "product_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_order_id_orders_id_fk') THEN
  ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_user_id_user_id_fk') THEN
  ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "merchant" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "category_id" text;
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "sub_category_id" text;
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_category_id_category_id_fk') THEN
  ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_sub_category_id_subcategory_id_fk') THEN
  ALTER TABLE "product" ADD CONSTRAINT "product_sub_category_id_subcategory_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."subcategory"("id") ON DELETE no action ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN IF EXISTS "channels";
--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN IF EXISTS "transaction_id";
--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "callback_url" text;
--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "access_code" SET DATA TYPE text;
--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "paid_at" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "paid_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT IF EXISTS "payment_status_check";
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_status_check" CHECK ("payment"."payment_status" IN ('pending', 'initialized', 'paid', 'failed', 'cancelled', 'refunded'));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subcategory" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read_status" text DEFAULT 'unread' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subcategory_category_id_category_id_fk') THEN
  ALTER TABLE "subcategory" ADD CONSTRAINT "subcategory_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_user_id_user_id_fk') THEN
  ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscription_user_id_user_id_fk') THEN
  ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_provider_idx" ON "account" USING btree ("user_id","provider_id","account_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cartMealUnq" ON "cart_items" USING btree ("cart_id","product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_item_product_idx" ON "cart_items" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchant_approval_status_idx" ON "merchant" USING btree ("approval_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_user_status_idx" ON "orders" USING btree ("user_id","order_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_cart_idx" ON "orders" USING btree ("cart_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_created_idx" ON "orders" USING btree ("order_status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_order_idx" ON "orderItem" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_merchant_idx" ON "orderItem" USING btree ("merchant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_product_idx" ON "orderItem" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_merchant_idx" ON "product" USING btree ("merchant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_category_subcategory_idx" ON "product" USING btree ("category","sub_category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_subcategory_id_idx" ON "product" USING btree ("sub_category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_listing_idx" ON "product" USING btree ("product_status","created_at") WHERE "product"."deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_search_idx" ON "product" USING gin ("name" gin_trgm_ops,"description" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_reference_idx" ON "payment" USING btree ("payment_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_user_idx" ON "payment" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subcategory_category_name_idx" ON "subcategory" USING btree ("category_id","name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_user_created_idx" ON "notification" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_user_read_idx" ON "notification" USING btree ("user_id","read_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscription_user_endpoint_idx" ON "push_subscription" USING btree ("user_id","endpoint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_unprocessed_idx" ON "outbox" USING btree ("processed_at") WHERE "outbox"."processed_at" IS NULL;

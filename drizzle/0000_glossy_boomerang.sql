CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "role_check" CHECK ("user"."role" IN ('user', 'admin', 'merchant'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subtotal" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"total_item_price" integer
);
--> statement-breakpoint
CREATE TABLE "merchant" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_name" text NOT NULL,
	"business_logo" text NOT NULL,
	"business_description" text NOT NULL,
	"address" text NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "approval_status_check" CHECK ("merchant"."approval_status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cart_id" text NOT NULL,
	"subtotal" integer NOT NULL,
	"service_charge" integer DEFAULT 0,
	"delivery_fee" integer DEFAULT 0,
	"tax_amount" integer DEFAULT 0,
	"discount_amount" integer DEFAULT 0,
	"delivery_address" jsonb NOT NULL,
	"order_status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_status_check" CHECK ("orders"."order_status" IN ('pending', 'confirmed', 'processing', 'paid', 'out_for_delivery', 'delivered', 'cancelled')),
	CONSTRAINT "payment_status_check" CHECK ("orders"."payment_status" IN ('pending', 'paid', 'failed', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "orderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"line_total" integer
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"additional_images" jsonb,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"category" text NOT NULL,
	"sub_category" text NOT NULL,
	"product_status" text DEFAULT 'available' NOT NULL,
	"additional_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_status_check" CHECK ("product"."product_status" IN ('available', 'sold_out'))
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant" ADD CONSTRAINT "merchant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cartMealUnq" ON "cart_items" USING btree ("cart_id","product_id");
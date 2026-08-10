/** @format */
import Env from "@/env.ts";

const spec = {
 openapi: "3.0.0",
 info: {
  title: "HHG Commerce API",
  version: Env.VERSION || "1.0.0",
  description: "Hebrons Height Commerce API documentation",
 },
 servers: [
  {
   url: Env.BASE_URL,
   description: "Server",
  },
 ],
 components: {
  securitySchemes: {
   bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "Session",
    description:
     "Better Auth session token — either the auth_session_token cookie or Authorization: Bearer <token>",
   },
  },
  schemas: {
   APIResponse: {
    type: "object",
    properties: {
     status: { type: "string", example: "ok" },
     message: { type: "string" },
     data: { type: "object" },
    },
   },
   Error: {
    type: "object",
    properties: {
     message: { type: "string" },
     error: { type: "string", example: "RESOURCE_NOT_FOUND" },
     status: { type: "string", example: "error" },
    },
   },
   ValidationError: {
    type: "object",
    properties: {
     error: { type: "string", example: "Validation failed" },
     details: {
      type: "array",
      items: {
       type: "object",
       properties: {
        field: { type: "string" },
        message: { type: "string" },
       },
      },
     },
    },
   },
   User: {
    type: "object",
    properties: {
     id: { type: "string" },
     name: { type: "string" },
     email: { type: "string", format: "email" },
     emailVerified: { type: "boolean" },
     image: { type: "string", nullable: true },
     role: { type: "string", enum: ["user", "admin", "merchant"] },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   Session: {
    type: "object",
    properties: {
     id: { type: "string" },
     token: { type: "string" },
     userId: { type: "string" },
     expiresAt: { type: "string", format: "date-time" },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
     ipAddress: { type: "string", nullable: true },
     userAgent: { type: "string", nullable: true },
    },
   },
   UpdateUserDto: {
    type: "object",
    properties: {
     name: { type: "string", description: "New display name" },
     email: {
      type: "string",
      format: "email",
      description: "New email address",
     },
    },
   },
   Merchant: {
    type: "object",
    properties: {
     id: { type: "string" },
     userId: { type: "string" },
     businessName: { type: "string" },
     businessLogo: { type: "string" },
     businessDescription: { type: "string" },
     address: { type: "string" },
     approvalStatus: {
      type: "string",
      enum: ["pending", "approved", "rejected"],
     },
     approvedAt: { type: "string", format: "date-time", nullable: true },
     deletedAt: { type: "string", format: "date-time", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CreateMerchantDto: {
    type: "object",
    required: [
     "businessName",
     "businessLogo",
     "businessDescription",
     "address",
    ],
    properties: {
     businessName: { type: "string" },
     businessLogo: { type: "string", description: "URL of the business logo" },
     businessDescription: { type: "string" },
     address: { type: "string" },
    },
   },
   UpdateMerchantDto: {
    type: "object",
    properties: {
     businessName: { type: "string" },
     businessLogo: { type: "string" },
     businessDescription: { type: "string" },
     address: { type: "string" },
    },
   },
   MerchantAnalytics: {
    type: "object",
    properties: {
     totalOrders: { type: "integer" },
     totalRevenue: { type: "integer" },
     statusBreakdown: {
      type: "array",
      items: {
       type: "object",
       properties: {
        status: { type: "string" },
        count: { type: "integer" },
       },
      },
     },
     topProducts: {
      type: "array",
      items: {
       type: "object",
       properties: {
        productId: { type: "string" },
        name: { type: "string" },
        quantity: { type: "integer" },
        revenue: { type: "integer" },
       },
      },
     },
     periodCounts: {
      type: "array",
      items: {
       type: "object",
       properties: {
        date: { type: "string", example: "2025-01-01" },
        count: { type: "integer" },
        revenue: { type: "integer" },
       },
      },
     },
    },
   },
   Category: {
    type: "object",
    properties: {
     id: { type: "string" },
     name: { type: "string" },
     description: { type: "string", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   Subcategory: {
    type: "object",
    properties: {
     id: { type: "string" },
     categoryId: { type: "string" },
     name: { type: "string" },
     createdAt: { type: "string", format: "date-time" },
    },
   },
   CategoryWithSubcategories: {
    type: "object",
    properties: {
     id: { type: "string" },
     name: { type: "string" },
     description: { type: "string", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
     subcategories: {
      type: "array",
      items: { $ref: "#/components/schemas/Subcategory" },
     },
    },
   },
   Product: {
    type: "object",
    properties: {
     id: { type: "string" },
     merchantId: { type: "string", nullable: true },
     name: { type: "string" },
     description: { type: "string" },
     image: { type: "string" },
     additionalImages: {
      type: "array",
      items: { type: "string" },
      nullable: true,
     },
     price: { type: "integer" },
     quantity: { type: "integer" },
     categoryId: { type: "string", nullable: true },
     subCategoryId: { type: "string", nullable: true },
     category: { type: "string" },
     subCategory: { type: "string" },
     status: { type: "string", enum: ["available", "sold_out"] },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
      nullable: true,
     },
     deletedAt: { type: "string", format: "date-time", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CreateProductDto: {
    type: "object",
    required: [
     "name",
     "description",
     "image",
     "price",
     "quantity",
     "category",
     "subCategory",
     "additionalData",
    ],
    properties: {
     name: { type: "string" },
     description: { type: "string" },
     image: { type: "string", description: "URL of the product image" },
     price: { type: "integer" },
     quantity: { type: "integer" },
     category: {
      type: "string",
      description: "Must match an existing category name",
     },
     subCategory: {
      type: "string",
      description: "Must match an existing subcategory name",
     },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Required — additional product data as key-value map",
     },
    },
   },
   UpdateProductDto: {
    type: "object",
    properties: {
     name: { type: "string" },
     description: { type: "string" },
     image: { type: "string" },
     price: { type: "integer", minimum: 1 },
     quantity: { type: "integer", minimum: 1 },
     category: { type: "string" },
     subCategory: { type: "string" },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Optional additional product data",
     },
    },
   },
   ProductWithMerchant: {
    allOf: [
     { $ref: "#/components/schemas/Product" },
     {
      type: "object",
      properties: {
       merchant: {
        type: "object",
        nullable: true,
        properties: {
         id: { type: "string" },
         businessName: { type: "string" },
         businessLogo: { type: "string" },
         status: {
          type: "string",
          enum: ["pending", "approved", "rejected"],
          description: "Merchant approval status",
         },
        },
       },
      },
     },
    ],
   },
   Pagination: {
    type: "object",
    properties: {
     limit: { type: "integer" },
     pageNumber: { type: "integer" },
     totalProducts: { type: "integer" },
     totalPages: { type: "integer" },
     offset: { type: "integer" },
    },
   },
   OrderPagination: {
    type: "object",
    properties: {
     limit: { type: "integer" },
     pageNumber: { type: "integer" },
     totalOrders: { type: "integer" },
     totalPages: { type: "integer" },
     offset: { type: "integer" },
    },
   },
   Cart: {
    type: "object",
    properties: {
     id: { type: "string" },
     userId: { type: "string" },
     subtotal: { type: "integer", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CartItem: {
    type: "object",
    properties: {
     id: { type: "string" },
     cartId: { type: "string" },
     productId: { type: "string" },
     price: { type: "integer" },
     quantity: { type: "integer" },
     totalItemPrice: { type: "integer", nullable: true },
    },
   },
   CartAndItems: {
    type: "object",
    properties: {
     cart: { $ref: "#/components/schemas/Cart" },
     cart_items: {
      type: "array",
      items: { $ref: "#/components/schemas/CartItem" },
     },
    },
   },
   Order: {
    type: "object",
    properties: {
     id: { type: "string" },
     userId: { type: "string" },
     cartId: { type: "string" },
     subtotal: { type: "integer" },
     serviceCharge: { type: "integer", nullable: true },
     deliveryFee: { type: "integer", nullable: true },
     taxAmount: { type: "integer", nullable: true },
     discountAmount: { type: "integer", nullable: true },
     deliveryAddress: {
      type: "object",
      additionalProperties: { type: "string" },
     },
     orderStatus: {
      type: "string",
      enum: [
       "pending",
       "processing",
       "fulfilled",
       "failed",
       "out_for_delivery",
       "delivered",
       "cancelled",
      ],
     },
     paymentStatus: {
      type: "string",
      enum: [
       "pending",
       "processing",
       "paid",
       "failed",
       "cancelled",
       "refunded",
      ],
     },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   OrderItem: {
    type: "object",
    properties: {
     id: { type: "string" },
     orderId: { type: "string" },
     merchantId: { type: "string" },
     productId: { type: "string" },
     quantity: { type: "integer" },
     unitPrice: { type: "integer" },
     lineTotal: { type: "integer", nullable: true },
    },
   },
   OrderAndItems: {
    type: "object",
    properties: {
     order: { $ref: "#/components/schemas/Order" },
     order_items: {
      type: "array",
      items: { $ref: "#/components/schemas/OrderItem" },
     },
    },
   },
   OrderJoinRow: {
    type: "object",
    properties: {
     orders: { $ref: "#/components/schemas/Order" },
     orderItem: { $ref: "#/components/schemas/OrderItem" },
    },
   },
   CreateOrderDto: {
    type: "object",
    required: ["deliveryAddress"],
    properties: {
     deliveryAddress: {
      type: "object",
      required: ["address", "city", "state", "country", "line1"],
      properties: {
       address: { type: "string" },
       city: { type: "string" },
       state: { type: "string" },
       country: { type: "string" },
       line1: { type: "string" },
       line2: { type: "string", description: "Optional second address line" },
      },
     },
    },
   },
   UpdateOrderStatusDto: {
    type: "object",
    required: ["status"],
    properties: {
     status: {
      type: "string",
      enum: ["out_for_delivery", "delivered"],
      description:
       "New order status. Flow: processing → out_for_delivery → delivered",
     },
    },
   },
   Payment: {
    type: "object",
    properties: {
     id: { type: "string" },
     orderId: { type: "string" },
     email: { type: "string", format: "email" },
     userId: { type: "string" },
     amount: { type: "integer", nullable: true },
     currency: { type: "string", nullable: true },
     status: {
      type: "string",
      enum: [
       "pending",
       "initialized",
       "paid",
       "failed",
       "cancelled",
       "refunded",
      ],
      default: "pending",
     },
     attempts: { type: "integer", nullable: true },
     mode: { type: "string", nullable: true },
     rail: {
      type: "string",
      enum: ["initializePaystackCheckout", "initializeStripeCheckout"],
     },
     callbackUrl: { type: "string", nullable: true },
     paymentReference: { type: "string" },
     paymentProvider: { type: "string", nullable: true },
     accessCode: { type: "string", nullable: true },
     authorizationUrl: { type: "string", nullable: true },
     paidAt: { type: "string", format: "date-time", nullable: true },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CheckoutData: {
    type: "object",
    required: ["email", "currency", "rail"],
    properties: {
     email: { type: "string", format: "email" },
     currency: { type: "string" },
     rail: {
      type: "string",
      enum: ["initializePaystackCheckout", "initializeStripeCheckout"],
      description: "Payment rail to use",
     },
     callback_url: {
      type: "string",
      format: "uri",
      description: "URL to redirect back to after payment",
     },
     mode: {
      type: "string",
      enum: ["payment", "subscription", "setup"],
      description: "Stripe checkout mode (Stripe rail only)",
     },
     metadata: {
      type: "object",
      additionalProperties: true,
      description: "Optional metadata (merged with orderId)",
     },
    },
   },
   CheckoutResult: {
    type: "object",
    required: ["email", "currency", "rail", "checkout_url"],
    properties: {
     email: { type: "string", format: "email" },
     amount: {
      type: "integer",
      nullable: true,
      description: "Amount charged — Paystack rail only (absent for Stripe)",
     },
     currency: { type: "string" },
     rail: {
      type: "string",
      enum: ["initializePaystackCheckout", "initializeStripeCheckout"],
     },
     mode: {
      type: "string",
      enum: ["payment", "subscription", "setup"],
      nullable: true,
     },
     callbackUrl: { type: "string", format: "uri", nullable: true },
     checkout_url: { type: "string", format: "uri" },
     reference: {
      type: "string",
      description: "Paystack reference or Stripe session ID",
     },
     access_code: {
      type: "string",
      description: "Paystack access code (Paystack only)",
     },
    },
   },
   Notification: {
    type: "object",
    properties: {
     id: { type: "string" },
     userId: { type: "string" },
     title: { type: "string" },
     message: { type: "string" },
     type: { type: "string", enum: ["order_update", "stock_alert", "system"] },
     read: { type: "string", enum: ["read", "unread"] },
     createdAt: { type: "string", format: "date-time" },
    },
   },
   AssetType: {
    type: "string",
    enum: ["profile", "product", "business", "additional"],
    description:
     "Asset type for Cloudinary uploads — literal values: `profile` (user avatar image), `product` (product main image), `business` (merchant business logo), `additional` (extra images for a product). The webhook dispatches on this value.",
    "x-enumDescriptions": [
     {
      value: "profile",
      description: "User avatar — updates the authenticated user's `image`",
     },
     {
      value: "product",
      description: "Product main image — updates the product's `image`",
     },
     {
      value: "business",
      description:
       "Merchant business logo — updates the merchant's `businessLogo`",
     },
     {
      value: "additional",
      description:
       "Extra product image — appends to the product's `additionalImages`",
     },
    ],
   },
   UploadResult: {
    type: "object",
    description:
     "Full Cloudinary upload response returned by the upload endpoint",
    required: ["public_id", "secure_url"],
    properties: {
     asset_id: { type: "string", description: "Cloudinary asset ID" },
     public_id: { type: "string", description: "Cloudinary public ID" },
     version: { type: "integer", description: "Cloudinary asset version" },
     version_id: { type: "string", description: "Cloudinary version ID" },
     signature: {
      type: "string",
      description: "Cloudinary response signature",
     },
     width: { type: "integer" },
     height: { type: "integer" },
     format: { type: "string", description: "Image format (e.g. png, jpg)" },
     resource_type: {
      type: "string",
      description: "Cloudinary resource type (image)",
      example: "image",
     },
     created_at: { type: "string", format: "date-time" },
     tags: { type: "array", items: { type: "string" } },
     bytes: { type: "integer", description: "File size in bytes" },
     type: {
      type: "string",
      description: "Asset type (upload)",
      example: "upload",
     },
     etag: { type: "string" },
     placeholder: { type: "boolean" },
     url: {
      type: "string",
      format: "uri",
      description: "HTTP URL of the uploaded image",
     },
     secure_url: {
      type: "string",
      format: "uri",
      description: "HTTPS URL of the uploaded image",
     },
     asset_folder: { type: "string" },
     display_name: { type: "string" },
     original_filename: { type: "string" },
     api_key: { type: "string", description: "API key used for the upload" },
    },
   },
  },
 },
 paths: {
  "/health": {
   get: {
    tags: ["Health"],
    summary: "Health check endpoint",
    responses: {
     "200": {
      description: "Server is healthy",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          db: { type: "string", example: "connected" },
          uptime: { type: "integer", example: 1234 },
          timestamp: { type: "string", format: "date-time" },
         },
        },
       },
      },
     },
     "503": {
      description: "Service degraded — database disconnected",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "degraded" },
          db: { type: "string", example: "disconnected" },
          uptime: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/auth/sign-up/email": {
   post: {
    tags: ["Authentication"],
    summary: "Register a new user with email and password",
    operationId: "signUpWithEmailAndPassword",
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
         name: { type: "string", description: "The name of the user" },
         email: {
          type: "string",
          format: "email",
          description: "The email of the user",
         },
         password: {
          type: "string",
          minLength: 6,
          description: "The password of the user",
         },
         image: {
          type: "string",
          format: "uri",
          description: "The profile image URL of the user",
         },
         role: {
          type: "string",
          enum: ["user", "admin", "merchant"],
          description: "User role",
         },
         callbackURL: {
          type: "string",
          description: "URL to use for email verification callback",
         },
         rememberMe: {
          type: "boolean",
          default: true,
          description: "If false, the session will not be remembered",
         },
        },
       },
      },
      "application/x-www-form-urlencoded": {
       schema: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
         name: { type: "string" },
         email: { type: "string", format: "email" },
         password: { type: "string", minLength: 6 },
         rememberMe: { type: "boolean", default: true },
        },
       },
      },
     },
    },
    responses: {
     "200": {
      description: "User registered successfully",
      headers: {
       "Set-Cookie": {
        description: "Sets the auth_session_token cookie (auto sign-in)",
        schema: { type: "string" },
       },
      },
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          token: {
           type: "string",
           nullable: true,
           description: "Authentication token for the session",
          },
          user: { $ref: "#/components/schemas/User" },
         },
        },
       },
      },
     },
     "400": {
      description: "Bad Request — missing or invalid params",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Not Found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "User already exists or failed to create user",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "429": {
      description: "Too Many Requests — rate limited",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Internal Server Error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/auth/sign-in/email": {
   post: {
    tags: ["Authentication"],
    summary: "Login with email and password",
    operationId: "signInEmail",
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
         email: {
          type: "string",
          format: "email",
          description: "Email of the user",
         },
         password: { type: "string", description: "Password of the user" },
         callbackURL: {
          type: "string",
          description: "Callback URL for email verification redirect",
         },
         rememberMe: {
          type: "boolean",
          default: true,
          description: "If false, the session will not be remembered",
         },
        },
       },
      },
      "application/x-www-form-urlencoded": {
       schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
         email: { type: "string", format: "email" },
         password: { type: "string" },
         rememberMe: { type: "boolean", default: true },
        },
       },
      },
     },
    },
    responses: {
     "200": {
      description: "Login successful",
      headers: {
       "Set-Cookie": {
        description: "Sets the auth_session_token cookie",
        schema: { type: "string" },
       },
      },
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          redirect: {
           type: "boolean",
           example: false,
           description: "Indicates whether a redirect is needed",
          },
          token: { type: "string", description: "Session token" },
          url: {
           type: "string",
           nullable: true,
           description: "URL for redirect (if applicable)",
          },
          user: { $ref: "#/components/schemas/User" },
         },
        },
       },
      },
     },
     "400": {
      description: "Bad Request — missing or invalid params",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid credentials",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Not Found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "429": {
      description: "Too Many Requests — rate limited",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Internal Server Error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/auth/sign-out": {
   post: {
    tags: ["Authentication"],
    summary: "Sign out the current user and revoke the session",
    operationId: "signOut",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Successfully signed out",
      content: {
       "application/json": {
        schema: {
         type: "object",
         required: ["success"],
         properties: {
          success: {
           type: "boolean",
           example: true,
           description: "Indicates if the session was revoked successfully",
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Internal Server Error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/auth/session": {
   get: {
    tags: ["Authentication"],
    summary: "Get the current session and user (better-auth)",
    description:
     "Returns the active session for the request cookie/Bearer token, or null when unauthenticated.",
    responses: {
     "200": {
      description: "Session data or null",
      content: {
       "application/json": {
        schema: {
         type: "object",
         nullable: true,
         properties: {
          session: { $ref: "#/components/schemas/Session" },
          user: { $ref: "#/components/schemas/User" },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/auth/user": {
   get: {
    tags: ["Authentication"],
    summary: "Get the currently authenticated user (better-auth)",
    responses: {
     "200": {
      description: "Authenticated user or null",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/User" },
       },
      },
     },
    },
   },
  },
  "/api/docs": {
   get: {
    tags: ["Docs"],
    summary: "Swagger UI documentation",
    responses: {
     "200": {
      description: "Swagger UI HTML",
      content: {
       "text/html": { schema: { type: "string" } },
      },
     },
    },
   },
  },
  "/api/docs.json": {
   get: {
    tags: ["Docs"],
    summary: "Raw OpenAPI specification (JSON)",
    responses: {
     "200": {
      description: "The full OpenAPI spec served as JSON",
      content: {
       "application/json": { schema: { type: "object" } },
      },
     },
    },
   },
  },
  "/api/user/profile": {
   get: {
    tags: ["User"],
    summary: "Get authenticated user's profile",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "User profile fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "user profile fetched successfully",
          },
          data: { $ref: "#/components/schemas/User" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": { description: "Forbidden — user role not authorized" },
    },
   },
  },
  "/api/user/update": {
   put: {
    tags: ["User"],
    summary: "Update authenticated user's profile (name, email)",
    security: [{ bearerAuth: [] }],
    requestBody: {
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/UpdateUserDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "User profile updated successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "user profile updated successfully",
          },
          data: { $ref: "#/components/schemas/User" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": { description: "Forbidden — user role not authorized" },
    },
   },
  },
  "/api/merchant/profile": {
   get: {
    tags: ["Merchant"],
    summary: "Get merchant profile for authenticated merchant",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Fetched merchant profile",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched merchant profile" },
          data: {
           type: "object",
           properties: {
            merchant: { $ref: "#/components/schemas/Merchant" },
            user: { $ref: "#/components/schemas/User" },
           },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/merchant/analytics": {
   get: {
    tags: ["Merchant"],
    summary:
     "Get merchant analytics (orders, revenue, top products, period counts)",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Analytics fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "analytics fetched successfully",
          },
          data: { $ref: "#/components/schemas/MerchantAnalytics" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/merchant": {
   post: {
    tags: ["Merchant"],
    summary: "Create a new merchant profile",
    security: [{ bearerAuth: [] }],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/CreateMerchantDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Merchant profile created",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "merchant profile created" },
          data: { $ref: "#/components/schemas/Merchant" },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed — missing required fields",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/merchant/{merchantId}": {
   put: {
    tags: ["Merchant"],
    summary: "Update merchant profile",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "merchantId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Merchant ID",
     },
    ],
    requestBody: {
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/UpdateMerchantDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Merchant profile updated",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "merchant profile updated" },
          data: { $ref: "#/components/schemas/Merchant" },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   delete: {
    tags: ["Merchant"],
    summary: "Delete merchant profile (soft delete)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "merchantId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Merchant ID",
     },
    ],
    responses: {
     "204": { description: "Merchant profile deleted, no content" },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/category": {
   get: {
    tags: ["Category"],
    summary: "Get all categories with subcategories (public)",
    responses: {
     "200": {
      description: "Categories fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "categories fetched successfully",
          },
          data: {
           type: "array",
           items: { $ref: "#/components/schemas/CategoryWithSubcategories" },
          },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/category/{categoryId}": {
   delete: {
    tags: ["Category"],
    summary: "Delete a category (admin only)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "categoryId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Category ID to delete",
     },
    ],
    responses: {
     "204": { description: "Category deleted, no content" },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — admin only",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Category not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/notification": {
   get: {
    tags: ["Notification"],
    summary: "Get authenticated user's notifications (latest 50)",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Notifications fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "notifications fetched successfully",
          },
          data: {
           type: "array",
           items: { $ref: "#/components/schemas/Notification" },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/notification/stream": {
   get: {
    tags: ["Notification"],
    summary: "SSE stream for real-time events",
    description:
     "Server-Sent Events stream. Connect with the auth session cookie or Bearer token, then listen for the named event types below via EventSource.addEventListener(eventName, cb). Each message body is the JSON payload for that event. A `: ping` comment heartbeat is sent every 30 seconds to keep the connection alive. Only events published with a top-level `userId` are delivered to that user's stream — the payload itself no longer contains the `userId` (it moved to the event envelope) but always includes an `outboxId` that correlates to the underlying outbox row. Events without a top-level `userId` (`inventory.low_stock`, payment *verified* webhook events, etc.) are NOT streamed — they are persisted as database notifications instead and fetched via `GET /api/notification`. See the `x-sse-events` extension below for the full list of deliverable event names and payload shapes.",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "SSE stream connected — events pushed as named event types",
      content: {
       "text/event-stream": {
        schema: { type: "string" },
        example:
         'event: order.placed\ndata: {"userId":"...","cartId":"...","orderId":"...","productIds":["..."]}\n\n: ping\n\n',
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
    "x-sse-events": {
     description:
      "Event names the client should listen for, with their payload shapes.",
     events: [
      {
       event: "order.placed",
       description: "A new order was placed by the user.",
       data: {
        type: "object",
        required: ["cartId", "orderId", "productIds", "outboxId"],
        properties: {
         cartId: { type: "string" },
         orderId: { type: "string" },
         productIds: { type: "array", items: { type: "string" } },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
      {
       event: "order.status.updated",
       description:
        "An order's status changed (e.g. out_for_delivery, delivered).",
       data: {
        type: "object",
        required: ["orderId", "status", "outboxId"],
        properties: {
         orderId: { type: "string" },
         status: {
          type: "string",
          enum: [
           "pending",
           "processing",
           "fulfilled",
           "failed",
           "out_for_delivery",
           "delivered",
           "cancelled",
          ],
         },
         message: { type: "string", description: "Human-readable update" },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
      {
       event: "order.cancelled",
       description: "An order was cancelled.",
       data: {
        type: "object",
        required: ["orderId", "productIds", "outboxId"],
        properties: {
         orderId: { type: "string" },
         productIds: { type: "array", items: { type: "string" } },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
      {
       event: "cart.low_stock",
       description: "A product in the user's cart is running low on stock.",
       data: {
        type: "object",
        required: ["productId", "productName", "quantity", "outboxId"],
        properties: {
         productId: { type: "string" },
         productName: { type: "string" },
         quantity: { type: "integer" },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
      {
       event: "payment.stripe.checkout.initialized",
       description:
        "A Stripe checkout session was created for the user's order.",
       data: {
        type: "object",
        required: ["orderId", "stripeData", "outboxId"],
        properties: {
         orderId: { type: "string" },
         stripeData: {
          type: "object",
          required: ["email", "rail", "currency", "checkout_url"],
          properties: {
           email: { type: "string", format: "email" },
           mode: { type: "string" },
           rail: { type: "string" },
           currency: { type: "string" },
           callbackUrl: { type: "string" },
           checkout_url: { type: "string", format: "uri" },
           reference: { type: "string" },
          },
         },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
      {
       event: "payment.paystack.checkout.initialized",
       description: "A Paystack checkout was initialized for the user's order.",
       data: {
        type: "object",
        required: ["orderId", "paystackData", "outboxId"],
        properties: {
         orderId: { type: "string" },
         paystackData: {
          type: "object",
          required: ["email", "rail", "currency", "checkout_url"],
          properties: {
           email: { type: "string", format: "email" },
           amount: { type: "integer", description: "Amount charged" },
           rail: { type: "string" },
           currency: { type: "string" },
           callbackUrl: { type: "string" },
           checkout_url: { type: "string", format: "uri" },
           reference: { type: "string" },
           access_code: { type: "string" },
          },
         },
         outboxId: {
          type: "string",
          description: "Correlates to the underlying outbox row",
         },
        },
       },
      },
     ],
    },
   },
  },
  "/api/notification/unread-count": {
   get: {
    tags: ["Notification"],
    summary: "Get unread notification count",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Unread count fetched",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "unread count fetched" },
          data: {
           type: "object",
           properties: {
            unread: { type: "integer" },
           },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/notification/{notificationId}/read": {
   put: {
    tags: ["Notification"],
    summary: "Mark a single notification as read",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "notificationId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Notification ID",
     },
    ],
    responses: {
     "200": {
      description: "Notification marked as read",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "notification marked as read" },
          data: { $ref: "#/components/schemas/Notification" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/notification/read-all": {
   put: {
    tags: ["Notification"],
    summary: "Mark all notifications as read",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "All notifications marked as read",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "all notifications marked as read",
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/product/latest": {
   get: {
    tags: ["Product"],
    summary: "Get latest available products (paginated, public)",
    parameters: [
     {
      name: "pageSize",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      description: "Number of items per page (max 50)",
     },
     {
      name: "pageNumber",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
      description: "Page number",
     },
    ],
    responses: {
     "200": {
      description: "Fetched latest products",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched latest products" },
          data: {
           type: "array",
           items: { $ref: "#/components/schemas/ProductWithMerchant" },
          },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/product/by-categories": {
   get: {
    tags: ["Product"],
    summary: "Get products grouped by category with subcategories (public)",
    responses: {
     "200": {
      description: "Products by categories fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "products by categories fetched successfully",
          },
          data: {
           type: "array",
           items: {
            type: "object",
            properties: {
             category: { $ref: "#/components/schemas/Category" },
             subcategories: {
              type: "array",
              items: {
               type: "object",
               properties: {
                subcategory: { $ref: "#/components/schemas/Subcategory" },
                products: {
                 type: "array",
                 items: { $ref: "#/components/schemas/Product" },
                },
               },
              },
             },
            },
           },
          },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/product": {
   get: {
    tags: ["Product"],
    summary: "Get all available products (paginated, filterable, public)",
    parameters: [
     {
      name: "pageSize",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
     },
     {
      name: "pageNumber",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
     },
     {
      name: "search",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Search products by name or description",
     },
     {
      name: "category",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by category name",
     },
     {
      name: "subCategory",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by subcategory name",
     },
    ],
    responses: {
     "200": {
      description: "Products fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "products fetched successfully" },
          data: {
           type: "object",
           properties: {
            data: {
             type: "object",
             properties: {
              products: {
               type: "array",
               items: { $ref: "#/components/schemas/Product" },
              },
              pagination: { $ref: "#/components/schemas/Pagination" },
             },
            },
           },
          },
         },
        },
       },
      },
     },
    },
   },
   post: {
    tags: ["Product"],
    summary: "Create a new product",
    security: [{ bearerAuth: [] }],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/CreateProductDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Product created successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product created successfully" },
          data: { $ref: "#/components/schemas/Product" },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/product/merchant": {
   get: {
    tags: ["Product"],
    summary: "Get authenticated merchant's own products",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Fetched merchant products",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched merchant products" },
          data: {
           type: "object",
           properties: {
            merchant: { $ref: "#/components/schemas/Merchant" },
            products: {
             type: "array",
             items: { $ref: "#/components/schemas/Product" },
            },
           },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Failed to fetch merchant products",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/product/{productId}": {
   get: {
    tags: ["Product"],
    summary: "Get a single product by ID (user role required)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID",
     },
    ],
    responses: {
     "200": {
      description: "Fetched a product",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched a product" },
          data: { $ref: "#/components/schemas/Product" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Product not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   put: {
    tags: ["Product"],
    summary: "Update a product",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID",
     },
    ],
    requestBody: {
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/UpdateProductDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Product updated successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product updated successfully" },
          data: { $ref: "#/components/schemas/Product" },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Product not found or not owned by merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   delete: {
    tags: ["Product"],
    summary: "Delete a product (soft delete)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID",
     },
    ],
    responses: {
     "200": {
      description: "Product deleted successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product deleted successfully" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user is not a merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Product not found or not owned by merchant",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/product/{merchantId}/merchant": {
   get: {
    tags: ["Product"],
    summary: "Get products for a specific merchant (user role required)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "merchantId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Merchant ID",
     },
    ],
    responses: {
     "200": {
      description: "Fetched products for merchant",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched product for merchant" },
          data: {
           type: "object",
           properties: {
            merchant: { $ref: "#/components/schemas/Merchant" },
            products: {
             type: "array",
             items: { $ref: "#/components/schemas/Product" },
            },
           },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Failed to fetch merchant products",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/cart/{cartId}": {
   get: {
    tags: ["Cart"],
    summary: "Get user's cart with items by cart ID",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "cartId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Cart ID",
     },
    ],
    responses: {
     "200": {
      description: "User cart fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "user cart fetched successfully",
          },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Cart not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/cart/{productId}": {
   put: {
    tags: ["Cart"],
    summary: "Add a product to the cart",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID to add",
     },
    ],
    responses: {
     "200": {
      description: "Product added to cart",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product added to cart" },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": { description: "Product not found or out of stock" },
     "500": {
      description: "Product threshold exceeded",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   delete: {
    tags: ["Cart"],
    summary: "Remove a product from the cart",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID to remove",
     },
    ],
    responses: {
     "200": {
      description: "Product removed from cart",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product removed from cart" },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/cart/{productId}/increment": {
   put: {
    tags: ["Cart"],
    summary: "Increment cart item quantity by 1",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID",
     },
    ],
    responses: {
     "200": {
      description: "Product quantity incremented",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product quantity incremented" },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": { description: "Product not found or out of stock" },
     "500": {
      description: "Product threshold exceeded",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/cart/{productId}/decrement": {
   put: {
    tags: ["Cart"],
    summary: "Decrement cart item quantity by 1 (deletes item at quantity 1)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "productId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Product ID",
     },
    ],
    responses: {
     "200": {
      description: "Product quantity decremented",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "product quantity decremented" },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/order/merchant": {
   get: {
    tags: ["Order"],
    summary:
     "Get orders for the authenticated user's merchant store (paginated)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "pageSize",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
     },
     {
      name: "pageNumber",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
     },
     {
      name: "status",
      in: "query",
      required: false,
      schema: {
       type: "string",
       enum: [
        "pending",
        "processing",
        "fulfilled",
        "failed",
        "out_for_delivery",
        "delivered",
        "cancelled",
       ],
      },
      description: "Filter by order status",
     },
    ],
    responses: {
     "200": {
      description: "Merchant orders fetched successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "merchant orders fetched successfully",
          },
          data: {
           type: "object",
           properties: {
            fetchedOrders: {
             type: "array",
             items: { $ref: "#/components/schemas/OrderJoinRow" },
            },
            pagination: { $ref: "#/components/schemas/OrderPagination" },
           },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — merchant only",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/order/status": {
   get: {
    tags: ["Order"],
    summary: "Get user's orders filtered by status (defaults to pending)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "status",
      in: "query",
      required: false,
      schema: {
       type: "string",
       default: "pending",
       enum: [
        "pending",
        "processing",
        "fulfilled",
        "failed",
        "out_for_delivery",
        "delivered",
        "cancelled",
       ],
      },
      description: "Order status to filter by (default: pending)",
     },
    ],
    responses: {
     "200": {
      description: "Fetched orders by status",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched order status" },
          data: {
           type: "array",
           items: { $ref: "#/components/schemas/OrderJoinRow" },
          },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "No orders found for the given status",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/order/{orderId}": {
   get: {
    tags: ["Order"],
    summary: "Get order details by order ID",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "orderId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Order ID",
     },
    ],
    responses: {
     "200": {
      description: "Fetched order details",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "fetched order details" },
          data: { $ref: "#/components/schemas/OrderAndItems" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Order not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   put: {
    tags: ["Order"],
    summary: "Cancel an order (only if not yet paid)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "orderId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Order ID to cancel",
     },
    ],
    responses: {
     "200": {
      description: "Order cancelled",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "order cancelled" },
          data: { $ref: "#/components/schemas/Order" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Order not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "Order already cancelled or already paid — cannot cancel",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
   delete: {
    tags: ["Order"],
    summary: "Delete an order and its items",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "orderId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Order ID to delete",
     },
    ],
    responses: {
     "200": {
      description: "Order deleted successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "order deleted" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "Invalid order",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/order/{orderId}/status": {
   put: {
    tags: ["Order"],
    summary: "Update order status (merchant only)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "orderId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Order ID",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/UpdateOrderStatusDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Order status updated",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "order out for delivery" },
          data: { $ref: "#/components/schemas/Order" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — merchant only",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": { description: "Order not found for this merchant" },
     "422": {
      description: "Invalid status transition",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/order/{cartId}": {
   post: {
    tags: ["Order"],
    summary: "Place an order from a cart",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "cartId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Cart ID to place order from",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/CreateOrderDto" },
      },
     },
    },
    responses: {
     "200": {
      description: "Order placed",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "order placed" },
          data: {
           type: "object",
           properties: {
            orderId: { type: "string", description: "Newly created order ID" },
           },
          },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Cart, product, merchant, or item not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "Order already created for this cart",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/payment/initialize/{orderId}": {
   post: {
    tags: ["Payment"],
    summary: "Initialize payment for an order (Paystack or Stripe checkout)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "orderId",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Order ID to initialize payment for",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: { $ref: "#/components/schemas/CheckoutData" },
      },
     },
    },
    responses: {
     "200": {
      description: "Checkout session created successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: {
           type: "string",
           example: "Checkout session created successfully",
          },
          data: { $ref: "#/components/schemas/CheckoutResult" },
         },
        },
       },
      },
     },
     "400": {
      description: "Validation failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Order not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "Invalid order state or payment provider error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Failed to initialize payment",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/payment/success": {
   get: {
    tags: ["Payment"],
    summary: "Payment success page (plain text response)",
    security: [{ bearerAuth: [] }],
    parameters: [
     {
      name: "session_id",
      in: "query",
      required: true,
      schema: { type: "string" },
      description: "Stripe Checkout session ID",
     },
    ],
    responses: {
     "200": {
      description: "Payment successful — returns customer name as plain text",
      content: {
       "text/html": {
        schema: { type: "string", example: "John Doe" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/payment/cancel": {
   get: {
    tags: ["Payment"],
    summary: "Payment cancellation page (plain text response)",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Payment failed — returns plain text",
      content: {
       "text/html": {
        schema: { type: "string", example: "Payment failed" },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/upload/upload-image": {
   post: {
    tags: ["Upload"],
    summary: "Upload an image to Cloudinary (server-side)",
    description:
     "Uploads an image to Cloudinary on the server. Send `{ file, folder }` in the JSON request body — `file` is the image as a base64 data URI (e.g. `data:image/png;base64,...`) or a public image URL, `folder` is the asset type. The server signs the request and forwards it to Cloudinary, then returns Cloudinary's full upload result. Cloudinary then notifies the server via webhook and the related record (user avatar / product image / business logo / product additional images) is updated automatically — no further API call needed.",
    security: [{ bearerAuth: [] }],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        required: ["file", "folder"],
        properties: {
         file: {
          type: "string",
          description:
           "Image to upload — base64 data URI (e.g. `data:image/png;base64,...`) or public image URL",
         },
         folder: { $ref: "#/components/schemas/AssetType" },
        },
       },
      },
     },
    },
    responses: {
     "201": {
      description:
       "Image uploaded to Cloudinary — full Cloudinary upload response (the signature is generated server-side and never exposed to the client)",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "image uploaded successfully" },
          data: { $ref: "#/components/schemas/UploadResult" },
         },
        },
       },
      },
     },
     "401": {
      description: "Unauthorized — invalid or missing session token",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "403": {
      description: "Forbidden — user or merchant role required",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Failed to upload image to Cloudinary",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/webhook/stripe": {
   post: {
    tags: ["Webhook"],
    summary: "Stripe webhook handler (checkout.session.completed/expired)",
    description:
     "Requires the stripe-signature header. Verifies with the Stripe webhook secret before processing. The request body must be sent RAW (no JSON parsing).",
    parameters: [
     {
      name: "stripe-signature",
      in: "header",
      required: true,
      schema: { type: "string" },
      description: "Stripe signature used to verify the webhook",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        description: "Raw Stripe event object (raw body, signed)",
       },
      },
     },
    },
    responses: {
     "200": {
      description: "Webhook processed successfully",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          received: { type: "boolean", example: true },
         },
        },
       },
      },
     },
     "400": {
      description: "Webhook signature verification failed",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "500": {
      description: "Webhook processing error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/webhook/paystack": {
   post: {
    tags: ["Webhook"],
    summary: "Paystack webhook handler (charge.success/charge.failed)",
    description:
     "Requires the x-paystack-signature header (HMAC-SHA512 of the raw body). The request body must be sent RAW (no JSON parsing).",
    parameters: [
     {
      name: "x-paystack-signature",
      in: "header",
      required: true,
      schema: { type: "string" },
      description: "HMAC-SHA512 signature of the raw request body",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        description: "Raw Paystack event object (raw body, signed)",
       },
      },
     },
    },
    responses: {
     "200": {
      description: "Webhook acknowledged",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          received: { type: "boolean", example: true },
         },
        },
       },
      },
     },
     "422": {
      description: "Invalid JSON payload or signature verification failed",
      content: {
       "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
       },
      },
     },
     "500": {
      description: "Webhook processing error",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
  "/api/webhook/cloudinary": {
   post: {
    tags: ["Webhook"],
    summary: "Cloudinary webhook handler (upload notification)",
    description:
     "Requires x-cld-timestamp and x-cld-signature headers (5-minute validity). The public_id encodes the folder type and user ID as <folder>-<userId>. Dispatches by folder: profile → user image, product → product image, business → merchant business logo, additional → product additional images.",
    parameters: [
     {
      name: "x-cld-timestamp",
      in: "header",
      required: true,
      schema: { type: "string" },
      description:
       "Unix timestamp when the notification was sent (max 300s old)",
     },
     {
      name: "x-cld-signature",
      in: "header",
      required: true,
      schema: { type: "string" },
      description: "Cloudinary signature of the raw request body",
     },
    ],
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        description:
         "Cloudinary upload notification payload (raw body, signed)",
        properties: {
         public_id: { type: "string", example: "profile-<userId>" },
         secure_url: { type: "string", format: "uri" },
        },
       },
      },
     },
    },
    responses: {
     "200": {
      description: "Upload completed",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "upload completed" },
          data: {
           type: "object",
           description: "Updated user, merchant, or product row",
          },
         },
        },
       },
      },
     },
     "403": {
      description: "Missing security headers or invalid webhook signature",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "422": {
      description: "Invalid timestamp or unsupported upload folder",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
     "404": {
      description: "Merchant profile not found",
      content: {
       "application/json": { schema: { $ref: "#/components/schemas/Error" } },
      },
     },
    },
   },
  },
 },
};

export const options: Record<string, unknown> = {
 explorer: true,
 customSiteTitle: "HHG Commerce API Docs",
};

export default spec;

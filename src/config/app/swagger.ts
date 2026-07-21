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
    description: "Better Auth session token",
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
     error: { type: "string" },
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
     email: { type: "string" },
     emailVerified: { type: "boolean" },
     image: { type: "string", nullable: true },
     role: { type: "string", enum: ["user", "admin", "merchant"] },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
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
     file: {
      type: "string",
      format: "binary",
      description: "New avatar image file (multipart/form-data)",
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
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CreateMerchantDto: {
    type: "object",
    required: ["businessName", "businessDescription", "address"],
    properties: {
     businessName: { type: "string" },
     businessDescription: { type: "string" },
     address: { type: "string" },
     businessLogo: {
      type: "string",
      description:
       "Provided via file upload (multipart/form-data field 'file')",
     },
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
   Product: {
    type: "object",
    properties: {
     id: { type: "string" },
     merchantId: { type: "string" },
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
     category: { type: "string" },
     subCategory: { type: "string" },
     status: { type: "string", enum: ["available", "sold_out"] },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
      nullable: true,
     },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CreateProductDto: {
    type: "object",
    required: [
     "name",
     "description",
     "price",
     "quantity",
     "category",
     "subCategory",
    ],
    properties: {
     name: { type: "string" },
     description: { type: "string" },
     price: { type: "integer" },
     quantity: { type: "integer" },
     category: { type: "string" },
     subCategory: { type: "string" },
     image: {
      type: "string",
      description:
       "Provided via file upload (multipart/form-data field 'file')",
     },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
     },
    },
   },
   UpdateProductDto: {
    type: "object",
    properties: {
     name: { type: "string" },
     description: { type: "string" },
     image: { type: "string" },
     price: { type: "integer" },
     quantity: { type: "integer" },
     category: { type: "string" },
     subCategory: { type: "string" },
     additionalData: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Optional additional product data",
     },
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
     userId: { type: "string" },
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
     serviceCharge: { type: "integer" },
     deliveryFee: { type: "integer" },
     taxAmount: { type: "integer" },
     discountAmount: { type: "integer" },
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
      properties: {
       address: { type: "string" },
       city: { type: "string" },
       state: { type: "string" },
       country: { type: "string" },
       line1: { type: "string" },
       line2: { type: "string", description: "Optional second address line" },
      },
      required: ["address", "city", "state", "country", "line1"],
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
     rail: { type: "string" },
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
     rail: { type: "string" },
     callback_url: {
      type: "string",
      format: "uri",
      description: "URL to redirect back to after payment",
     },
     mode: {
      type: "string",
      enum: ["payment", "subscription", "setup"],
     },
     metadata: {
      type: "object",
      description: "Optional metadata key-value pairs",
      additionalProperties: { type: "string" },
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
   Pagination: {
    type: "object",
    properties: {
     pageSize: { type: "integer", minimum: 1, maximum: 50 },
     pageNumber: { type: "integer", minimum: 1 },
    },
   },
   UploadResult: {
    type: "object",
    properties: {
     public_id: { type: "string" },
     url: { type: "string" },
     folder: { type: "string" },
     signature: { type: "string" },
     timestamp: { type: "integer" },
     apiKey: { type: "string" },
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
      description: "Welcome to Hebrons Height Commerce APP",
      content: {
       "text/plain": {
        schema: { type: "string" },
       },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user role not authorized" },
    },
   },
  },
  "/api/user/update": {
   put: {
    tags: ["User"],
    summary: "Update authenticated user's profile (name, email, avatar)",
    security: [{ bearerAuth: [] }],
    requestBody: {
     content: {
      "multipart/form-data": {
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
     "401": { description: "Unauthorized — invalid or missing session token" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Merchant profile not found" },
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
      "multipart/form-data": {
       schema: {
        type: "object",
        required: ["businessName", "businessDescription", "address", "file"],
        properties: {
         businessName: { type: "string" },
         businessDescription: { type: "string" },
         address: { type: "string" },
         file: {
          type: "string",
          format: "binary",
          description: "Business logo image file",
         },
        },
       },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Merchant profile not found" },
    },
   },
   delete: {
    tags: ["Merchant"],
    summary: "Delete merchant profile",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Merchant profile not found" },
    },
   },
  },
  "/api/product/latest": {
   get: {
    tags: ["Product"],
    summary: "Get latest available products (paginated)",
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
           items: {
            allOf: [
             { $ref: "#/components/schemas/Product" },
             {
              type: "object",
              properties: {
               merchant: {
                type: "object",
                properties: {
                 id: { type: "string" },
                 businessName: { type: "string" },
                 businessLogo: { type: "string" },
                 status: { type: "string" },
                },
                nullable: true,
               },
              },
             },
            ],
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
    summary: "Get all available products (paginated, filterable)",
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
      description: "Filter by category",
     },
     {
      name: "subCategory",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by subcategory",
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
              pagination: {
               type: "object",
               properties: {
                limit: { type: "integer" },
                pageNumber: { type: "integer" },
                totalProducts: { type: "integer" },
                totalPages: { type: "integer" },
                offset: { type: "integer" },
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
   post: {
    tags: ["Product"],
    summary: "Create a new product",
    security: [{ bearerAuth: [] }],
    requestBody: {
     required: true,
     content: {
      "multipart/form-data": {
       schema: {
        type: "object",
         required: [
          "name",
          "description",
          "price",
          "quantity",
          "category",
          "subCategory",
          "additionalData",
          "file",
         ],
        properties: {
         name: { type: "string" },
         description: { type: "string" },
         price: { type: "integer" },
         quantity: { type: "integer" },
         category: { type: "string" },
         subCategory: { type: "string" },
         additionalData: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Optional additional product data as JSON object",
         },
         file: {
          type: "string",
          format: "binary",
          description: "Product main image file",
         },
        },
       },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
    },
   },
  },
  "/api/product/{productId}": {
   get: {
    tags: ["Product"],
    summary: "Get a single product by ID",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Product not found" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Product not found" },
    },
   },
   delete: {
    tags: ["Product"],
    summary: "Delete a product",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Product not found" },
    },
   },
  },
  "/api/product/{merchantId}/merchant": {
   get: {
    tags: ["Product"],
    summary: "Get products for a specific merchant",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Merchant not found" },
    },
   },
  },
  "/api/product/additional-images/{productId}": {
   put: {
    tags: ["Product"],
    summary: "Upload additional media/images for a product (up to 5 files)",
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
     required: true,
     content: {
      "multipart/form-data": {
       schema: {
        type: "object",
        required: ["files"],
        properties: {
         files: {
          type: "array",
          items: {
           type: "string",
           format: "binary",
          },
          description: "Up to 5 image files to attach as additional media",
         },
        },
       },
      },
     },
    },
    responses: {
     "200": {
      description: "Product updated successfully with additional images",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a merchant" },
     "404": { description: "Product not found" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Cart not found" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Cart not found" },
     "422": { description: "Product is out of stock or threshold exceeded" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
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
          message: {
           type: "string",
           example: "product quantity incremented",
          },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Cart item not found" },
     "422": { description: "Product is out of stock or threshold exceeded" },
    },
   },
  },
  "/api/cart/{productId}/decrement": {
   put: {
    tags: ["Cart"],
    summary: "Decrement cart item quantity by 1",
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
          message: {
           type: "string",
           example: "product quantity decremented",
          },
          data: { $ref: "#/components/schemas/CartAndItems" },
         },
        },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Cart item not found" },
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
             items: {
              type: "object",
              properties: {
               orders: { $ref: "#/components/schemas/Order" },
               orderItem: { $ref: "#/components/schemas/OrderItem" },
              },
             },
            },
            pagination: {
             type: "object",
             properties: {
              limit: { type: "integer" },
              pageNumber: { type: "integer" },
              totalOrders: { type: "integer" },
              totalPages: { type: "integer" },
              offset: { type: "integer" },
             },
            },
           },
          },
         },
        },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
    },
   },
  },
  "/api/order/status": {
   get: {
    tags: ["Order"],
    summary: "Get user's orders filtered by status",
    security: [{ bearerAuth: [] }],
    parameters: [
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
      description: "Order status to filter by",
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Order not found" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Order not found" },
     "422": { description: "Order has already been paid — cannot cancel" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Order not found" },
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
     "401": { description: "Unauthorized — invalid or missing session token" },
     "403": { description: "Forbidden — user is not a user" },
     "404": { description: "Cart not found" },
    },
   },
  },
  "/api/payment/initialize/{orderId}": {
   post: {
    tags: ["Payment"],
    summary:
     "Initialize payment for an order (returns checkout session data for Stripe/Paystack)",
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
          data: {
           type: "object",
           properties: {
            checkout_url: { type: "string" },
            reference: { type: "string" },
            access_code: { type: "string" },
           },
          },
         },
        },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
     "422": {
      description: "Invalid order — order or payment status is not pending",
     },
     "409": { description: "Payment already created for this order" },
     "500": { description: "Failed to initialize payment" },
    },
   },
  },
  "/api/payment/success": {
   get: {
    tags: ["Payment"],
    summary: "Payment success page",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Payment successful",
      content: {
       "text/html": {
        schema: { type: "string", example: "Payment successful" },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
    },
   },
  },
  "/api/payment/failed": {
   get: {
    tags: ["Payment"],
    summary: "Payment failure page",
    security: [{ bearerAuth: [] }],
    responses: {
     "200": {
      description: "Payment failed",
      content: {
       "text/html": {
        schema: { type: "string", example: "Payment failed" },
       },
      },
     },
     "401": { description: "Unauthorized — invalid or missing session token" },
    },
   },
  },
  "/api/stripe/webhook": {
   post: {
    tags: ["Webhook"],
    summary: "Stripe webhook handler (checkout.session.completed/expired)",
    requestBody: {
     required: true,
     content: {
      "application/json": {
       schema: {
        type: "object",
        description: "Raw Stripe event object",
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
     "400": { description: "Webhook signature verification failed" },
     "500": { description: "Webhook processing error" },
    },
   },
  },
 },
 "/api/paystack/webhook": {
  post: {
   tags: ["Webhook"],
   summary: "Paystack webhook handler (charge.success/charge.failed)",
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       description: "Raw Paystack event object",
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
         status: { type: "string", example: "success" },
        },
       },
      },
     },
    },
   },
  },
 },
 "/api/upload/cloudinary-signature": {
  post: {
   tags: ["Upload"],
   summary: "Generate a Cloudinary upload signature",
   security: [{ bearerAuth: [] }],
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       required: ["folder"],
       properties: {
        folder: {
         type: "string",
         enum: ["product_images", "avatar", "product_videos"],
        },
       },
      },
     },
    },
   },
   responses: {
    "201": {
     description: "Upload signature created",
     content: {
      "application/json": {
       schema: {
        type: "object",
        properties: {
         status: { type: "string", example: "ok" },
         message: { type: "string", example: "signature created" },
         data: { $ref: "#/components/schemas/UploadResult" },
        },
       },
      },
     },
    },
    "401": { description: "Unauthorized — invalid or missing session token" },
    "403": { description: "Forbidden — user role not authorized" },
   },
  },
 },
 "/api/category": {
  get: {
   tags: ["Category"],
   summary: "Get all categories with subcategories",
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
          items: {
           type: "object",
           properties: {
            category: { $ref: "#/components/schemas/Category" },
            subcategories: {
             type: "array",
             items: { $ref: "#/components/schemas/Subcategory" },
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
    "401": { description: "Unauthorized — invalid or missing session token" },
    "403": { description: "Forbidden — admin only" },
    "404": { description: "Category not found" },
   },
  },
 },
 "/api/product/by-categories": {
  get: {
   tags: ["Product"],
   summary: "Get products grouped by category with subcategories",
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
 "/api/product/primary-image/{productId}": {
  put: {
   tags: ["Product"],
    summary: "Update the primary image of a product (merchant only)",
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
    required: true,
    content: {
     "multipart/form-data": {
      schema: {
       type: "object",
       required: ["file"],
       properties: {
        file: {
         type: "string",
         format: "binary",
         description: "New primary image file",
        },
       },
      },
     },
    },
   },
   responses: {
    "200": {
     description: "Primary image updated",
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
    "401": { description: "Unauthorized — invalid or missing session token" },
    "403": { description: "Forbidden — merchant only" },
    "404": { description: "Product not found" },
   },
  },
 },
 "/api/merchant/analytics": {
  get: {
   tags: ["Merchant"],
   summary: "Get merchant analytics (orders, revenue, top products)",
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
         message: { type: "string", example: "analytics fetched" },
         data: {
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
               date: { type: "string" },
               count: { type: "integer" },
               revenue: { type: "integer" },
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
    "401": { description: "Unauthorized — invalid or missing session token" },
    "403": { description: "Forbidden — merchant only" },
   },
  },
 },
 "/api/notification/stream": {
  get: {
   tags: ["Notification"],
   summary: "SSE stream for real-time notification events",
   security: [{ bearerAuth: [] }],
   responses: {
    "200": {
     description: "SSE stream connected",
     content: {
      "text/event-stream": {
       schema: { type: "string" },
      },
     },
    },
    "401": { description: "Unauthorized — invalid or missing session token" },
   },
  },
 },
 "/api/notification/subscribe": {
  post: {
   tags: ["Notification"],
   summary: "Subscribe browser to push notifications",
   security: [{ bearerAuth: [] }],
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       required: ["endpoint", "keys"],
       properties: {
        endpoint: { type: "string" },
        keys: {
         type: "object",
         properties: {
          auth: { type: "string" },
          p256dh: { type: "string" },
         },
        },
       },
      },
     },
    },
   },
   responses: {
    "200": {
     description: "Subscribed successfully",
     content: {
      "application/json": {
       schema: {
        type: "object",
        properties: {
         status: { type: "string", example: "ok" },
         message: { type: "string", example: "subscribed successfully" },
        },
       },
      },
     },
    },
    "401": { description: "Unauthorized — invalid or missing session token" },
   },
  },
 },
 "/api/notification/unsubscribe": {
  post: {
   tags: ["Notification"],
   summary: "Unsubscribe browser from push notifications",
   security: [{ bearerAuth: [] }],
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       required: ["endpoint"],
       properties: {
        endpoint: { type: "string" },
       },
      },
     },
    },
   },
   responses: {
    "200": {
     description: "Unsubscribed successfully",
     content: {
      "application/json": {
       schema: {
        type: "object",
        properties: {
         status: { type: "string", example: "ok" },
         message: { type: "string", example: "unsubscribed successfully" },
        },
       },
      },
     },
    },
    "401": { description: "Unauthorized — invalid or missing session token" },
   },
  },
 },
 "/api/notification": {
  get: {
   tags: ["Notification"],
   summary: "Get authenticated user's notifications",
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
    "401": { description: "Unauthorized — invalid or missing session token" },
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
    "401": { description: "Unauthorized — invalid or missing session token" },
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
    "401": { description: "Unauthorized — invalid or missing session token" },
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
    "401": { description: "Unauthorized — invalid or missing session token" },
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
      schema: {
       type: "object",
       required: ["status"],
       properties: {
         status: {
          type: "string",
          enum: [
           "out_for_delivery",
           "delivered",
          ],
          description: "New order status",
         },
       },
      },
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
         message: { type: "string", example: "order status updated" },
         data: { $ref: "#/components/schemas/Order" },
        },
       },
      },
     },
    },
    "401": { description: "Unauthorized — invalid or missing session token" },
    "403": { description: "Forbidden — merchant only" },
    "404": { description: "Order not found" },
    "422": { description: "Invalid status transition" },
   },
  },
 },
 "/api/auth/register": {
  post: {
   tags: ["Authentication"],
   summary: "Register a new user",
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       required: ["name", "email", "password"],
       properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
       },
      },
     },
    },
   },
   responses: {
    "200": { description: "User registered successfully" },
    "400": { description: "Validation error" },
    "409": { description: "Email already exists" },
   },
  },
 },
 "/api/auth/login": {
  post: {
   tags: ["Authentication"],
   summary: "Login with email and password",
   requestBody: {
    required: true,
    content: {
     "application/json": {
      schema: {
       type: "object",
       required: ["email", "password"],
       properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" },
       },
      },
     },
    },
   },
   responses: {
    "200": { description: "Login successful" },
    "401": { description: "Invalid credentials" },
   },
  },
 },
};

export const options: Record<string, unknown> = {
 explorer: true,
 customSiteTitle: "HHG Commerce API Docs",
};

export default spec;

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
     status: { type: "string", example: "error" },
     message: { type: "string" },
     code: { type: "string" },
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
    required: [
     "businessName",
     "businessLogo",
     "businessDescription",
     "address",
    ],
    properties: {
     businessName: { type: "string" },
     businessLogo: { type: "string" },
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
   Product: {
    type: "object",
    properties: {
     id: { type: "string" },
     merchantId: { type: "string" },
     name: { type: "string" },
     description: { type: "string" },
     image: { type: "string" },
     additionalImages: {
      type: "object",
      additionalProperties: { type: "string" },
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
     "image",
     "price",
     "quantity",
     "category",
     "subCategory",
    ],
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
     additionalData: { type: "string" },
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
       "confirmed",
       "processing",
       "fulfilled",
       "paid",
       "out_for_delivery",
       "delivered",
       "cancelled",
       "failed",
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
       line2: { type: "string" },
      },
     },
    },
   },
   Payment: {
    type: "object",
    properties: {
     id: { type: "string" },
     orderId: { type: "string" },
     userId: { type: "string" },
     amount: { type: "integer", nullable: true },
     currency: { type: "string", nullable: true },
     payment_status: {
      type: "string",
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
     },
     attempts: { type: "integer", nullable: true },
     mode: { type: "string", nullable: true },
     rail: { type: "string" },
     channels: {
      type: "array",
      items: { type: "string" },
      nullable: true,
     },
     payment_reference: { type: "string" },
     payment_provider: { type: "string", nullable: true },
     access_code: { type: "string", nullable: true },
     authorization_url: { type: "string", nullable: true },
     transaction_id: { type: "string", nullable: true },
     paidAt: { type: "string", format: "date-time" },
     createdAt: { type: "string", format: "date-time" },
     updatedAt: { type: "string", format: "date-time" },
    },
   },
   CheckoutData: {
    type: "object",
    required: ["email", "amount", "currency", "rail"],
    properties: {
     email: { type: "string", format: "email" },
     amount: { type: "integer" },
     currency: { type: "string" },
     rail: {
      type: "string",
      enum: ["initializePaystackCheckout", "initializeStripeCheckout"],
     },
     channels: {
      type: "array",
      items: { type: "string" },
     },
     mode: {
      type: "string",
      enum: ["payment", "subscription", "setup"],
     },
    },
   },
   Pagination: {
    type: "object",
    properties: {
     pageSize: { type: "integer", minimum: 1, maximum: 50 },
     pageNumber: { type: "integer", minimum: 1 },
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
      description: "Server is running",
      content: {
       "text/plain": {
        schema: { type: "string" },
       },
      },
     },
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
          data: { $ref: "#/components/schemas/Merchant" },
         },
        },
       },
      },
     },
     "401": { description: "Unauthorized" },
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
     "204": { description: "Product deleted successfully, no content" },
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
    ],
    responses: {
     "200": {
      description: "Fetched merchant orders",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          data: { $ref: "#/components/schemas/OrderAndItems" },
         },
        },
       },
      },
     },
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
      required: true,
      schema: {
       type: "string",
       enum: [
        "pending",
        "confirmed",
        "processing",
        "paid",
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
          data: { $ref: "#/components/schemas/OrderAndItems" },
         },
        },
       },
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
          data: { type: "string", description: "Newly created order ID" },
         },
        },
       },
      },
     },
    },
   },
  },
  "/api/payment/initialize/{orderId}": {
   post: {
    tags: ["Payment"],
    summary: "Initialize payment for an order",
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
      description: "Payment initialized",
      content: {
       "application/json": {
        schema: {
         type: "object",
         properties: {
          status: { type: "string", example: "ok" },
          message: { type: "string", example: "payment initialized" },
          data: {
           type: "object",
           properties: {
            payment: { $ref: "#/components/schemas/Payment" },
            checkoutUrl: {
             type: "object",
             properties: {
              url: { type: "string" },
             },
             nullable: true,
            },
           },
          },
         },
        },
       },
      },
     },
     "400": { description: "Invalid order or payment already exists" },
     "409": { description: "Payment already created for this order" },
    },
   },
  },
  "/api/webhook/stripe": {
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

/** @format */
import Env from "@/env.ts";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "HHG Commerce API",
    version: Env.VERSION || "1.0.0",
    description:
      "Hebrons Height Commerce API — authentication via session cookie or JWT Bearer token, with role-scoped access for users, merchants, and administrators. Comprehensive product catalog, cart, order, and payment flows, plus real-time order/notification events over Server-Sent Events.",
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
          data: { type: "object", nullable: true },
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
          businessLogo: {
            type: "string",
            description: "URL of the business logo",
          },
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
          additionalImages: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional additional product image URLs — stored on the product's `additionalImages` field",
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
          additionalImages: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional additional product image URLs — stored on the product's `additionalImages` field",
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
      AdminAnalytics: {
        type: "object",
        properties: {
          totalOrders: { type: "integer" },
          totalRevenue: { type: "integer" },
          totalUsers: { type: "integer" },
          totalMerchants: { type: "integer" },
          totalProducts: { type: "integer" },
          approvedMerchants: { type: "integer" },
          pendingMerchants: { type: "integer" },
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
      AdminUserPagination: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          pageNumber: { type: "integer" },
          totalUsers: { type: "integer" },
          totalPages: { type: "integer" },
          offset: { type: "integer" },
        },
      },
      AdminMerchantPagination: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          pageNumber: { type: "integer" },
          totalMerchants: { type: "integer" },
          totalPages: { type: "integer" },
          offset: { type: "integer" },
        },
      },
      AdminOrderPagination: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          pageNumber: { type: "integer" },
          totalOrders: { type: "integer" },
          totalPages: { type: "integer" },
          offset: { type: "integer" },
        },
      },
      AdminProductPagination: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          pageNumber: { type: "integer" },
          totalProducts: { type: "integer" },
          totalPages: { type: "integer" },
          offset: { type: "integer" },
        },
      },
      AdminPaymentPagination: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          pageNumber: { type: "integer" },
          totalPayments: { type: "integer" },
          totalPages: { type: "integer" },
          offset: { type: "integer" },
        },
      },
      MerchantWithUser: {
        type: "object",
        properties: {
          merchant: { $ref: "#/components/schemas/Merchant" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      OrderWithUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          subtotal: { type: "integer" },
          deliveryAddress: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          createdAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string", format: "email" },
              name: { type: "string" },
            },
          },
        },
      },
      CreateCategoryDto: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          subcategories: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional subcategory names to create with the category",
          },
        },
      },
      UpdateCategoryDto: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
      CreateSubcategoryDto: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
      UpdateSubcategoryDto: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
      SendNotificationDto: {
        type: "object",
        required: ["title", "message", "type"],
        properties: {
          userId: {
            type: "string",
            description: "Target user — omit to broadcast to all users",
          },
          title: { type: "string" },
          message: { type: "string" },
          type: {
            type: "string",
            enum: ["order_update", "stock_alert", "system"],
          },
        },
      },
      ReviewMerchantDto: {
        type: "object",
        required: ["approvalStatus"],
        properties: {
          approvalStatus: {
            type: "string",
            enum: ["approved", "rejected"],
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
            items: {
              type: "object",
              allOf: [
                { $ref: "#/components/schemas/CartItem" },
                {
                  type: "object",
                  properties: {
                    product: { $ref: "#/components/schemas/Product" },
                    lowStock: {
                      type: "boolean",
                      description:
                        "True when the product's stock is at or below the low-stock threshold",
                    },
                  },
                },
              ],
            },
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
            items: {
              type: "object",
              allOf: [
                { $ref: "#/components/schemas/OrderItem" },
                {
                  type: "object",
                  properties: {
                    product: { $ref: "#/components/schemas/Product" },
                    lowStock: {
                      type: "boolean",
                      description:
                        "True when the product's stock is at or below the low-stock threshold",
                    },
                  },
                },
              ],
            },
          },
        },
      },
      OrderJoinRow: {
        type: "object",
        properties: {
          orders: { $ref: "#/components/schemas/Order" },
          orderItem: {
            allOf: [
              { $ref: "#/components/schemas/OrderItem" },
              {
                type: "object",
                properties: {
                  lineTotal: { type: "integer" },
                  product: {
                    allOf: [{ $ref: "#/components/schemas/Product" }],
                    nullable: true,
                    description:
                      "Product details — null when the product record is missing",
                  },
                  lowStock: {
                    type: "boolean",
                    description:
                      "True when the product's stock is at or below the low-stock threshold (false when product is null)",
                  },
                },
              },
            ],
          },
        },
      },
      UserOrderWithItems: {
        type: "object",
        properties: {
          orders: { $ref: "#/components/schemas/Order" },
          order_items: {
            type: "array",
            items: {
              type: "object",
              allOf: [
                { $ref: "#/components/schemas/OrderItem" },
                {
                  type: "object",
                  properties: {
                    product: { $ref: "#/components/schemas/Product" },
                    lowStock: {
                      type: "boolean",
                      description:
                        "True when the product's stock is at or below the low-stock threshold",
                    },
                  },
                },
              ],
            },
          },
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
              line2: {
                type: "string",
                description: "Optional second address line",
              },
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
            description: "Amount charged",
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
          type: {
            type: "string",
            enum: ["order_update", "stock_alert", "system"],
          },
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
            description:
              "User avatar — updates the authenticated user's `image`",
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
          format: {
            type: "string",
            description: "Image format (e.g. png, jpg)",
          },
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
          access_mode: {
            type: "string",
            description: "Cloudinary asset access mode",
            example: "public",
          },
          asset_folder: { type: "string" },
          display_name: { type: "string" },
          original_filename: { type: "string" },
          api_key: {
            type: "string",
            description: "API key used for the upload",
          },
        },
      },
    },
  },
  paths: {
    "/api/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get platform-wide analytics (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Admin analytics fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "admin analytics fetched successfully",
                    },
                    data: { $ref: "#/components/schemas/AdminAnalytics" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users with pagination and search (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50 },
            description: "Number of users per page (default 10)",
          },
          {
            name: "pageNumber",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            description: "Page number (default 1)",
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Search users by name or email",
          },
        ],
        responses: {
          "200": {
            description: "Users fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "users fetched successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/User" },
                        },
                        pagination: {
                          $ref: "#/components/schemas/AdminUserPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/users/{userId}": {
      get: {
        tags: ["Admin"],
        summary: "Get a single user (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description:
              "User fetched successfully — data is null when the user does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "user fetched successfully",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/merchants": {
      get: {
        tags: ["Admin"],
        summary:
          "List merchants with pagination and status filter (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50 },
            description: "Number of merchants per page (default 10)",
          },
          {
            name: "pageNumber",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            description: "Page number (default 1)",
          },
          {
            name: "approvalStatus",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            description: "Filter merchants by approval status",
          },
        ],
        responses: {
          "200": {
            description: "Merchants fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "merchants fetched successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/MerchantWithUser",
                          },
                        },
                        pagination: {
                          $ref: "#/components/schemas/AdminMerchantPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/merchants/{merchantId}/approval": {
      put: {
        tags: ["Admin"],
        summary: "Approve or reject a merchant application (admin only)",
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
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewMerchantDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Merchant review recorded — data is null when the merchant does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "merchant approved successfully",
                    },
                    data: { $ref: "#/components/schemas/Merchant" },
                  },
                },
              },
            },
          },
          "400": {
            description:
              "Validation failed or merchant is already in that state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin"],
        summary:
          "List all orders with pagination and status filter (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50 },
            description: "Number of orders per page (default 10)",
          },
          {
            name: "pageNumber",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            description: "Page number (default 1)",
          },
          {
            name: "orderStatus",
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
            description: "Filter orders by order status",
          },
        ],
        responses: {
          "200": {
            description: "Orders fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "orders fetched successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/OrderWithUser" },
                        },
                        pagination: {
                          $ref: "#/components/schemas/AdminOrderPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/orders/{orderId}": {
      get: {
        tags: ["Admin"],
        summary: "Get full order details with items (admin only)",
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
            description:
              "Order details fetched successfully — data is null when the order does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "order details fetched successfully",
                    },
                    data: { $ref: "#/components/schemas/OrderAndItems" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/products": {
      get: {
        tags: ["Admin"],
        summary: "List all products with pagination and search (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50 },
            description: "Number of products per page (default 10)",
          },
          {
            name: "pageNumber",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            description: "Page number (default 1)",
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Search products by name or description",
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
                    message: {
                      type: "string",
                      example: "products fetched successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/ProductWithMerchant",
                          },
                        },
                        pagination: {
                          $ref: "#/components/schemas/AdminProductPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/products/{productId}": {
      delete: {
        tags: ["Admin"],
        summary: "Soft delete any product (admin only)",
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
            description:
              "Product deleted successfully (200 even when the product does not exist)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "product deleted successfully",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/merchants/{merchantId}": {
      get: {
        tags: ["Admin"],
        summary: "Get a single merchant with its user (admin only)",
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
            description:
              "Merchant fetched successfully — data is null when the merchant does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "merchant fetched successfully",
                    },
                    data: { $ref: "#/components/schemas/MerchantWithUser" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/payments": {
      get: {
        tags: ["Admin"],
        summary:
          "List all payments with pagination and status filter (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50 },
            description: "Number of payments per page (default 10)",
          },
          {
            name: "pageNumber",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1 },
            description: "Page number (default 1)",
          },
          {
            name: "paymentStatus",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "pending",
                "initialized",
                "paid",
                "failed",
                "cancelled",
                "refunded",
              ],
            },
            description: "Filter payments by status",
          },
        ],
        responses: {
          "200": {
            description: "Payments fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "payments fetched successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Payment" },
                        },
                        pagination: {
                          $ref: "#/components/schemas/AdminPaymentPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/categories": {
      post: {
        tags: ["Admin"],
        summary: "Create a category with optional subcategories (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCategoryDto" },
            },
          },
        },
        responses: {
          "200": {
            description: "Category created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "category created successfully",
                    },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed or category name already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/categories/{categoryId}": {
      put: {
        tags: ["Admin"],
        summary: "Update a category (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Category ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCategoryDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Category updated successfully — data is null when the category does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "category updated successfully",
                    },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed or category name already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/categories/{categoryId}/subcategories": {
      post: {
        tags: ["Admin"],
        summary: "Create a subcategory under a category (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Parent category ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSubcategoryDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Subcategory created successfully — data is null when the category does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "subcategory created successfully",
                    },
                    data: { $ref: "#/components/schemas/Subcategory" },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/subcategories/{subcategoryId}": {
      put: {
        tags: ["Admin"],
        summary: "Update a subcategory (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "subcategoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Subcategory ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSubcategoryDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Subcategory updated successfully — data is null when the subcategory does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "subcategory updated successfully",
                    },
                    data: { $ref: "#/components/schemas/Subcategory" },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a subcategory (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "subcategoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Subcategory ID",
          },
        ],
        responses: {
          "200": {
            description:
              "Subcategory deleted successfully (200 even when the subcategory does not exist)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "subcategory deleted successfully",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/admin/notifications": {
      post: {
        tags: ["Admin"],
        summary:
          "Send a notification to one user or broadcast to all (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendNotificationDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Notification sent — data is null when the target user does not exist or there are no users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "notification sent successfully",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
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
                description:
                  "Sets the auth_session_token cookie (auto sign-in)",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": {
            description: "User already exists or failed to create user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "429": {
            description: "Too Many Requests — rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                  password: {
                    type: "string",
                    description: "Password of the user",
                  },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Not Found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "429": {
            description: "Too Many Requests — rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                      description:
                        "Indicates if the session was revoked successfully",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
          },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
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
            description:
              "Fetched merchant profile — data is null when the user has no merchant profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "fetched merchant profile",
                    },
                    data: {
                      type: "object",
                      nullable: true,
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Analytics fetched successfully — data is null when the user has no merchant profile",
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
                    data: {
                      allOf: [
                        { $ref: "#/components/schemas/MerchantAnalytics" },
                      ],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                    message: {
                      type: "string",
                      example: "merchant profile created",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "Merchant profile updated — data is null when the merchant profile does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "merchant profile updated",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
          "204": {
            description:
              "Merchant profile deleted, no content (204 even when the profile does not exist)",
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                      items: {
                        $ref: "#/components/schemas/CategoryWithSubcategories",
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
          "204": {
            description:
              "Category deleted, no content (204 even when the category does not exist)",
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
          "Server-Sent Events stream. Connect with the auth session cookie or Bearer token, then listen for the named event types below via EventSource.addEventListener(eventName, cb). Each message body is the JSON payload for that event. A `: ping` comment heartbeat is sent every 30 seconds to keep the connection alive. Only events published with a top-level `userId` are delivered to that user's stream — the payload itself no longer contains the `userId` (it moved to the event envelope) but always includes an `outboxId` that correlates to the underlying outbox row. Raw provider webhook events without a top-level `userId` (e.g. `payment.paystack.checkout.verified`) are NOT streamed — they are persisted as database notifications instead and fetched via `GET /api/notification`. The `inventory.low_stock` event is published from the inventory service WITH a top-level `userId` (the merchant's user ID), so it IS streamed to the merchant. The `PAYMENT_FULFILLED` event is published from the payment verification handler WITH a top-level `userId`, so it IS streamed to the user. See the `x-sse-events` extension below for the full list of deliverable event names and payload shapes.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description:
              "SSE stream connected — events pushed as named event types",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
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
                message: {
                  type: "string",
                  description: "Human-readable update",
                },
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
            description:
              "A product in the user's cart is running low on stock.",
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
            event: "inventory.low_stock",
            description:
              "A merchant's product is running low on stock — streamed to the merchant user.",
            data: {
              type: "object",
              required: [
                "userId",
                "productId",
                "productName",
                "quantity",
                "outboxId",
              ],
              properties: {
                userId: { type: "string" },
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
            description:
              "A Paystack checkout was initialized for the user's order.",
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
          {
            event: "PAYMENT_FULFILLED",
            description:
              "A payment was fulfilled (published from the payment verification handler) — the order is marked paid and fulfilled.",
            data: {
              type: "object",
              required: ["updatedPayment", "updatedOrder", "outboxId"],
              properties: {
                updatedPayment: {
                  type: "object",
                  required: ["id", "orderId", "status", "paymentReference"],
                  properties: {
                    id: { type: "string" },
                    orderId: { type: "string" },
                    amount: { type: "integer" },
                    currency: { type: "string" },
                    status: { type: "string", enum: ["paid"] },
                    paymentReference: { type: "string" },
                    paymentProvider: { type: "string" },
                    paidAt: { type: "string", format: "date-time" },
                  },
                },
                updatedOrder: {
                  type: "object",
                  required: ["id", "userId", "orderStatus", "paymentStatus"],
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    orderStatus: { type: "string", enum: ["fulfilled"] },
                    paymentStatus: { type: "string", enum: ["paid"] },
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
                    message: {
                      type: "string",
                      example: "unread count fetched",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Notification marked as read — data is null when the notification does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "notification marked as read",
                    },
                    data: {
                      allOf: [{ $ref: "#/components/schemas/Notification" }],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user or merchant role required (administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                    message: {
                      type: "string",
                      example: "fetched latest products",
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ProductWithMerchant",
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
                                subcategory: {
                                  $ref: "#/components/schemas/Subcategory",
                                },
                                products: {
                                  type: "array",
                                  items: {
                                    $ref: "#/components/schemas/Product",
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
                    message: {
                      type: "string",
                      example: "products fetched successfully",
                    },
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
                              $ref: "#/components/schemas/Pagination",
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
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProductDto" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Product created — data is null when the user has no merchant profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "product created successfully",
                    },
                    data: {
                      allOf: [{ $ref: "#/components/schemas/Product" }],
                      nullable: true,
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
                    message: {
                      type: "string",
                      example: "fetched merchant products",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Failed to fetch merchant products",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Fetched a product — data is null when the product does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: { type: "string", example: "fetched a product" },
                    data: {
                      allOf: [{ $ref: "#/components/schemas/Product" }],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Product updated — data is null when the product does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "product updated successfully",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user is not a merchant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Product deleted — succeeds with 200 even when the product does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "product deleted successfully",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — merchant role required (users and administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                    message: {
                      type: "string",
                      example: "fetched product for merchant",
                    },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description:
              "Forbidden — user role required (merchants and administrators are rejected)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Failed to fetch merchant products",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "User cart fetched — data is null when the user has no cart",
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
                    data: {
                      allOf: [{ $ref: "#/components/schemas/CartAndItems" }],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "Product added to cart — returns the updated cart; a nonexistent product is silently skipped and the current cart is returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "product added to cart",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": { description: "Product is out of stock" },
          "500": {
            description: "Product threshold exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
                    message: {
                      type: "string",
                      example: "product removed from cart",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "Product quantity incremented — returns the updated cart; a nonexistent product is silently skipped and the current cart is returned",
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
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": { description: "Product is out of stock" },
          "500": {
            description: "Product threshold exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/cart/{productId}/decrement": {
      put: {
        tags: ["Cart"],
        summary:
          "Decrement cart item quantity by 1 (deletes item at quantity 1)",
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
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
                        pagination: {
                          $ref: "#/components/schemas/OrderPagination",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — merchant only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/order/status": {
      get: {
        tags: ["Order"],
        summary:
          "Get user's orders filtered by status, paginated (defaults to pending)",
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
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            description: "Number of orders per page (max 50)",
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
            description:
              "Fetched orders by status (empty array when none found)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "fetched order status",
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/UserOrderWithItems",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "Fetched order details — data is null when the order does not exist",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "fetched order details",
                    },
                    data: {
                      allOf: [{ $ref: "#/components/schemas/OrderAndItems" }],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Order cancelled — data is null when the order does not exist",
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
          "422": {
            description:
              "Order already cancelled or already paid — cannot cancel",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Order status updated — data is null when the order is not for this merchant",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "order out for delivery",
                    },
                    data: {
                      allOf: [{ $ref: "#/components/schemas/Order" }],
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — merchant only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "400": {
            description: "Invalid status transition",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
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
            description:
              "Order placed — data.orderId is null when the cart, product, merchant, or item is not found",
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
                        orderId: {
                          type: "string",
                          nullable: true,
                          description: "Newly created order ID",
                        },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": {
            description: "Order already created for this cart",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/payment/initialize/{orderId}": {
      post: {
        tags: ["Payment"],
        summary:
          "Initialize payment for an order (Paystack or Stripe checkout)",
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": {
            description: "Invalid order state or payment provider error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description:
              "Failed to initialize payment — returned when the order is not found or the provider call fails",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
            description:
              "Payment successful — returns customer name as plain text",
            content: {
              "text/html": {
                schema: { type: "string", example: "John Doe" },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/payment/verify/{reference}": {
      get: {
        tags: ["Payment"],
        summary: "Verify a Paystack payment by reference",
        description:
          "Calls the Paystack verify API for the given payment reference and returns the raw verification data.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reference",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Paystack payment reference to verify",
          },
        ],
        responses: {
          "200": {
            description: "Payment verification data from Paystack",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: {
                      type: "string",
                      example: "Payment verified successfully",
                    },
                    data: {
                      type: "object",
                      description: "Raw Paystack verification response data",
                    },
                  },
                },
              },
            },
          },
          "422": {
            description:
              "Paystack verification failed, or amount/currency mismatch",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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
                    message: {
                      type: "string",
                      example: "image uploaded successfully",
                    },
                    data: { $ref: "#/components/schemas/UploadResult" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized — invalid or missing session token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden — user or merchant role required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Failed to upload image to Cloudinary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
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

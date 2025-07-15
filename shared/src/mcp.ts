import { z } from "zod";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  AddToCartRequestSchema,
  RemoveFromCartRequestSchema,
  CartSchema,
  ProductSchema,
  ApiErrorSchema,
} from "./types";

// Define MCP message types
export enum MCPMessageType {
  REQUEST = "request",
  RESPONSE = "response",
  ERROR = "error",
}

// Define MCP action types
export enum MCPActionType {
  LOGIN = "login",
  GET_PRODUCTS = "getProducts",
  GET_PRODUCT = "getProduct",
  ADD_TO_CART = "addToCart",
  REMOVE_FROM_CART = "removeFromCart",
  GET_CART = "getCart",
  CREATE_CART = "createCart",
  UPDATE_CART = "updateCart",
  DELETE_CART = "deleteCart",
  GET_STORE_STATS = "getStoreStats",
  GET_AVAILABLE_OPTIONS = "getAvailableOptions",
}

// Base MCP Message Schema
const MCPMessageBaseSchema = z.object({
  type: z.nativeEnum(MCPMessageType),
  requestId: z.string(),
  timestamp: z.number(),
});

// MCP Request Schema
export const MCPRequestSchema = MCPMessageBaseSchema.extend({
  type: z.literal(MCPMessageType.REQUEST),
  action: z.nativeEnum(MCPActionType),
  payload: z.any(), // Will be validated based on action type
});

// MCP Response Schema
export const MCPResponseSchema = MCPMessageBaseSchema.extend({
  type: z.literal(MCPMessageType.RESPONSE),
  action: z.nativeEnum(MCPActionType),
  payload: z.any(), // Will be validated based on action type
});

// MCP Error Schema
export const MCPErrorSchema = MCPMessageBaseSchema.extend({
  type: z.literal(MCPMessageType.ERROR),
  action: z.nativeEnum(MCPActionType).optional(),
  error: ApiErrorSchema,
});

// Type definitions
export type MCPMessage = z.infer<typeof MCPMessageBaseSchema>;
export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
export type MCPError = z.infer<typeof MCPErrorSchema>;

// Action-specific payload schemas
export const ActionPayloadSchemas = {
  [MCPActionType.LOGIN]: {
    request: LoginRequestSchema,
    response: LoginResponseSchema,
  },
  [MCPActionType.GET_PRODUCTS]: {
    request: z.void(),
    response: z.array(ProductSchema),
  },
  [MCPActionType.GET_PRODUCT]: {
    request: z.object({ id: z.number() }),
    response: ProductSchema,
  },
  [MCPActionType.ADD_TO_CART]: {
    request: AddToCartRequestSchema,
    response: CartSchema,
  },
  [MCPActionType.REMOVE_FROM_CART]: {
    request: RemoveFromCartRequestSchema,
    response: CartSchema,
  },
  [MCPActionType.GET_CART]: {
    request: z.void(),
    response: CartSchema,
  },

  [MCPActionType.CREATE_CART]: {
    request: z.object({
      userId: z.number(),
      products: z.array(
        z.object({
          productId: z.number(),
          quantity: z.number(),
        })
      ),
    }),
    response: CartSchema,
  },
  [MCPActionType.UPDATE_CART]: {
    request: z.object({
      cartId: z.number(),
      products: z.array(
        z.object({
          productId: z.number(),
          quantity: z.number(),
        })
      ),
    }),
    response: CartSchema,
  },
  [MCPActionType.DELETE_CART]: {
    request: z.object({ cartId: z.number() }),
    response: z.object({ success: z.boolean(), message: z.string() }),
  },
  [MCPActionType.GET_STORE_STATS]: {
    request: z.void(),
    response: z.object({
      totalProducts: z.number(),
      totalCost: z.number(),
      averagePrice: z.number(),
      categories: z.array(
        z.object({
          name: z.string(),
          productCount: z.number(),
          totalCost: z.number(),
          averagePrice: z.number(),
        })
      ),
    }),
  },
  [MCPActionType.GET_AVAILABLE_OPTIONS]: {
    request: z.void(),
    response: z.object({
      availableActions: z.array(z.nativeEnum(MCPActionType)),
      productCategories: z.array(z.string()),
      queryExamples: z.array(z.string()),
    }),
  },
};

// Helper function to validate MCP messages
export function validateMCPRequest(message: unknown): MCPRequest {
  const request = MCPRequestSchema.parse(message);

  // Validate payload based on action type
  if (ActionPayloadSchemas[request.action]?.request) {
    const payloadSchema = ActionPayloadSchemas[request.action].request;
    if (payloadSchema !== z.void()) {
      request.payload = payloadSchema.parse(request.payload);
    }
  }

  return request;
}

export function validateMCPResponse(message: unknown): MCPResponse {
  const response = MCPResponseSchema.parse(message);

  // Validate payload based on action type
  if (ActionPayloadSchemas[response.action]?.response) {
    const payloadSchema = ActionPayloadSchemas[response.action].response;
    response.payload = payloadSchema.parse(response.payload);
  }

  return response;
}

// Helper function to create MCP request
export function createMCPRequest(
  action: MCPActionType,
  payload: any,
  requestId: string = crypto.randomUUID()
): MCPRequest {
  return {
    type: MCPMessageType.REQUEST,
    action,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}

// Helper function to create MCP response
export function createMCPResponse(
  action: MCPActionType,
  payload: any,
  requestId: string
): MCPResponse {
  return {
    type: MCPMessageType.RESPONSE,
    action,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}

// Helper function to create MCP error
export function createMCPError(
  error: { message: string; code?: string },
  requestId: string,
  action?: MCPActionType
): MCPError {
  return {
    type: MCPMessageType.ERROR,
    error,
    requestId,
    action,
    timestamp: Date.now(),
  };
}

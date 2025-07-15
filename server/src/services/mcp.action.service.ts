import axios from "axios";
import {
  MCPActionType,
  createMCPRequest,
  validateMCPResponse,
} from "../../../shared/src/mcp";

// MCP Server URL (internal communication since we're on the same server)
const MCP_SERVER_URL = "http://localhost:3001/api/mcp";

export class MCPActionService {
  /**
   * Execute an MCP action
   */
  async executeAction(action: MCPActionType, payload: any): Promise<any> {
    try {
      console.log(`Executing action: ${action}`);

      // Handle void payload actions
      let finalPayload = payload;
      if (
        action === MCPActionType.GET_PRODUCTS ||
        action === MCPActionType.GET_CART ||
        action === MCPActionType.GET_STORE_STATS ||
        action === MCPActionType.GET_AVAILABLE_OPTIONS
      ) {
        finalPayload = undefined;
      }

      const request = createMCPRequest(action, finalPayload);
      const response = await axios.post(MCP_SERVER_URL, request);
      const mcpResponse = validateMCPResponse(response.data);
      return mcpResponse.payload;
    } catch (error: any) {
      console.error(`Error executing action ${action}:`, error.message);
      throw error;
    }
  }

  /**
   * Execute product detail retrieval for cart items
   */
  async getProductsForCartItems(cart: any): Promise<any[]> {
    if (
      !cart.products ||
      !Array.isArray(cart.products) ||
      cart.products.length === 0
    ) {
      return [];
    }

    const cartProducts = [];

    for (const cartItem of cart.products) {
      try {
        // For each cart item, get the full product details
        if (cartItem.productId) {
          const productResult = await this.executeAction(
            MCPActionType.GET_PRODUCT,
            { id: cartItem.productId }
          );

          if (productResult) {
            // Add quantity from cart to the product
            cartProducts.push({
              ...productResult,
              quantity: cartItem.quantity,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching product details for cart item:`, error);
      }
    }

    return cartProducts;
  }
}

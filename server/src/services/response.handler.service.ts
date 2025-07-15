import { MCPActionType } from "../../../shared/src/mcp";
import { MCPActionService } from "./mcp.action.service";

// Define structured response type
export interface StructuredResponse {
  reasoning: string;
  items: any[];
  text: string;
}

export class ResponseHandlerService {
  private mcpActionService: MCPActionService;

  constructor(mcpActionService: MCPActionService) {
    this.mcpActionService = mcpActionService;
  }

  /**
   * Parse a raw LLM response into a structured format
   */
  async parseResponse(
    responseText: string,
    actionResults: any[]
  ): Promise<StructuredResponse> {
    let structuredResponse: StructuredResponse = {
      reasoning: "",
      items: [],
      text: responseText,
    };

    try {
      // Try to extract JSON from the response
      const jsonMatch =
        responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
        responseText.match(/({[\s\S]*})/);

      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[1]);
        structuredResponse = {
          reasoning: parsedResponse.reasoning || "",
          items: parsedResponse.items || [],
          text: parsedResponse.text || responseText,
        };
      }

      // Special handling for cart actions
      await this.handleCartData(structuredResponse, actionResults);

      return structuredResponse;
    } catch (error) {
      console.error("Error parsing LLM JSON response:", error);
      // Return the original unstructured response as fallback
      return structuredResponse;
    }
  }

  /**
   * Handle cart data for responses
   */
  private async handleCartData(
    structuredResponse: StructuredResponse,
    actionResults: any[]
  ): Promise<void> {
    // Find cart-related actions
    const cartAction = actionResults.find(
      (action) =>
        action.action === MCPActionType.GET_CART ||
        action.action === MCPActionType.ADD_TO_CART ||
        action.action === MCPActionType.UPDATE_CART
    );

    if (!cartAction || !cartAction.result) return;

    const cart = cartAction.result;

    // If there are products in the cart
    if (
      cart.products &&
      Array.isArray(cart.products) &&
      cart.products.length > 0
    ) {
      // Fetch full product details for cart items
      const cartProducts = await this.mcpActionService.getProductsForCartItems(
        cart
      );

      // Update the structured response with cart products
      if (cartProducts.length > 0) {
        structuredResponse.items = cartProducts;

        // If the response doesn't mention quantities, enhance it
        if (
          !structuredResponse.text.includes("quantity") &&
          !structuredResponse.text.includes("qty") &&
          // Check if we're in the stream handler or regular handler
          (cartAction.action === MCPActionType.GET_CART ||
            cartAction.action === MCPActionType.ADD_TO_CART)
        ) {
          structuredResponse.text = `${
            structuredResponse.text
          }\n\nYour cart contains ${
            cartProducts.length
          } products with the following quantities:\n${cartProducts
            .map(
              (p) =>
                `- ${p.title || `Product #${p.id}`}: Quantity ${p.quantity}`
            )
            .join("\n")}`;
        }
      }
    }
  }

  /**
   * Extract JSON from LLM response
   */
  extractJSON(text: string): any {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      throw new Error("Could not parse JSON from LLM response");
    }

    return JSON.parse(jsonMatch[1]);
  }
}

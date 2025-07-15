import { authApi, productsApi, LangChainService } from "./index";
import { CartService } from "./cart.service";
import {
  MCPActionType,
  createMCPResponse,
  createMCPError,
  MCPRequest,
  MCPResponse,
  MCPError,
} from "../../../shared/src/mcp";
import {
  LoginRequest,
  AddToCartRequest,
  RemoveFromCartRequest,
  CreateCartRequest,
  UpdateCartRequest,
  DeleteCartRequest,
} from "../../../shared/src/types";
import { Product } from "../../../shared/src/types";
import { AppError, ErrorCode, handleAsync, logError } from "../utils";

export class MCPService {
  private langchainService: LangChainService;
  private cartService: CartService;

  constructor() {
    this.langchainService = new LangChainService();
    this.cartService = new CartService();

    // Initialize the LangChain service
    this.langchainService.initialize().catch((err) => {
      logError(err, "MCPService.constructor");
    });
  }

  // Handle incoming MCP requests
  async handleRequest(request: MCPRequest): Promise<MCPResponse | MCPError> {
    try {
      const { action, payload, requestId } = request;

      let responsePayload;

      switch (action) {
        case MCPActionType.LOGIN:
          responsePayload = await this.handleLogin(payload as LoginRequest);
          break;

        case MCPActionType.GET_PRODUCTS:
          responsePayload = await this.handleGetProducts();
          break;

        case MCPActionType.GET_PRODUCT:
          responsePayload = await this.handleGetProduct(payload.id);
          break;

        case MCPActionType.ADD_TO_CART:
          responsePayload = await this.cartService.addToCart(
            payload as AddToCartRequest
          );
          break;

        case MCPActionType.REMOVE_FROM_CART:
          responsePayload = await this.cartService.removeFromCart(
            payload as RemoveFromCartRequest
          );
          break;

        case MCPActionType.GET_CART:
          responsePayload = await this.cartService.getCart();
          break;

        case MCPActionType.CREATE_CART:
          responsePayload = await this.cartService.createCart(
            payload as CreateCartRequest
          );
          break;

        case MCPActionType.UPDATE_CART:
          responsePayload = await this.cartService.updateCart(
            payload as UpdateCartRequest
          );
          break;

        case MCPActionType.DELETE_CART:
          responsePayload = await this.cartService.deleteCart(
            payload as DeleteCartRequest
          );
          break;

        case MCPActionType.GET_STORE_STATS:
          responsePayload = await this.handleGetStoreStats();
          break;

        case MCPActionType.GET_AVAILABLE_OPTIONS:
          responsePayload = await this.handleGetAvailableOptions();
          break;

        default:
          return createMCPError(
            {
              message: `Unsupported action: ${action}`,
              code: "UNSUPPORTED_ACTION",
            },
            requestId
          );
      }

      return createMCPResponse(action, responsePayload, requestId);
    } catch (error: any) {
      logError(error, `MCPService.handleRequest(${request.action})`);

      return createMCPError(
        {
          message:
            error.message || "An error occurred while processing the request",
          code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
        },
        request.requestId,
        request.action
      );
    }
  }

  // Handle login action
  private async handleLogin(payload: LoginRequest) {
    // 1. Call authentication API
    const [loginError, loginResponse] = await handleAsync(
      authApi.login(payload)
    );
    if (loginError) {
      logError(loginError, "MCPService.handleLogin");
      throw new AppError(
        "Failed to authenticate user",
        ErrorCode.UNAUTHORIZED,
        401
      );
    }

    const token = loginResponse!.token;

    // 2. Get user profile
    const [profileError, user] = await handleAsync(authApi.getProfile(token));
    if (profileError) {
      logError(profileError, "MCPService.handleLogin");
      throw new AppError(
        "Failed to retrieve user profile",
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }

    // 3. Initialize user's cart
    await this.cartService.initializeUserCart(user!.id);

    // 4. Return token and user
    return { token, user: user! };
  }

  // Handle get products action
  private async handleGetProducts() {
    const [error, products] = await handleAsync(productsApi.getAll());
    if (error) {
      logError(error, "MCPService.handleGetProducts");
      throw new AppError(
        "Failed to retrieve products",
        ErrorCode.API_ERROR,
        500
      );
    }
    return products;
  }

  // Handle get product action
  private async handleGetProduct(id: number) {
    const [error, product] = await handleAsync(productsApi.getById(id));
    if (error) {
      logError(error, "MCPService.handleGetProduct");
      throw new AppError(
        `Failed to retrieve product with ID ${id}`,
        ErrorCode.NOT_FOUND,
        404
      );
    }
    return product;
  }

  // Handle get store statistics action
  private async handleGetStoreStats() {
    // Get all products
    const [error, products] = await handleAsync(productsApi.getAll());
    if (error) {
      logError(error, "MCPService.handleGetStoreStats");
      throw new AppError(
        "Failed to retrieve products for store statistics",
        ErrorCode.API_ERROR,
        500
      );
    }

    // Calculate total cost and average price
    const totalCost = products!.reduce(
      (sum, product) => sum + product.price,
      0
    );
    const averagePrice = totalCost / products!.length;

    // Group products by category
    const categoriesMap: Record<string, Product[]> = {};
    products!.forEach((product) => {
      if (!categoriesMap[product.category]) {
        categoriesMap[product.category] = [];
      }
      categoriesMap[product.category].push(product);
    });

    // Calculate statistics for each category
    const categories = Object.keys(categoriesMap).map((name) => {
      const categoryProducts = categoriesMap[name];
      const categoryTotal = categoryProducts.reduce(
        (sum, p) => sum + p.price,
        0
      );
      return {
        name,
        productCount: categoryProducts.length,
        totalCost: categoryTotal,
        averagePrice: categoryTotal / categoryProducts.length,
      };
    });

    // Return the statistics
    return {
      totalProducts: products!.length,
      totalCost,
      averagePrice,
      categories,
    };
  }

  // Handle get available options action
  private async handleGetAvailableOptions() {
    // Get all available actions from the MCPActionType enum
    const availableActions = Object.values(MCPActionType);

    // Get all product categories
    const [error, productCategories] = await handleAsync(
      productsApi.getAllCategories()
    );
    if (error) {
      logError(error, "MCPService.handleGetAvailableOptions");
      throw new AppError(
        "Failed to retrieve product categories",
        ErrorCode.API_ERROR,
        500
      );
    }

    // Provide examples of natural language queries that can be used
    const queryExamples = [
      "Show me all products",
      "Find men's clothing under $50",
      "Show me jewelry with good ratings",
      "I'm looking for women's clothing",
      "What are your bestselling electronics?",
      "Show me items with a price less than $20",
      "Find products in the jewelery category",
      "Show me highly rated men's clothing",
    ];

    return {
      availableActions,
      productCategories,
      queryExamples,
    };
  }
}

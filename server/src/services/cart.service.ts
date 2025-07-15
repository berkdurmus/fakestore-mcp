import { cartApi } from "./fakestore.api.service";
import {
  Cart,
  AddToCartRequest,
  RemoveFromCartRequest,
  CreateCartRequest,
  UpdateCartRequest,
  DeleteCartRequest,
  DeleteCartResponse,
} from "../../../shared/src/types";
import { AppError, ErrorCode, handleAsync, logError } from "../utils";

// In-memory cart storage (since Fake Store API doesn't persist cart changes)
const cartStore: Record<number, Cart> = {};

export class CartService {
  constructor() {}

  // Handle add to cart action
  async addToCart(payload: AddToCartRequest): Promise<Cart> {
    // Use a fixed userId for demo purposes (in a real app, would come from auth)
    const userId = 1;

    // Get the current cart
    const [cartError, cart] = await handleAsync(this.getUserCart(userId));
    if (cartError) {
      logError(cartError, "CartService.addToCart");
      throw new AppError("Failed to get user cart", ErrorCode.CART_ERROR, 500);
    }

    // Find if product already exists in cart
    const existingProductIndex = cart!.products.findIndex(
      (item) => item.productId === payload.productId
    );

    if (existingProductIndex >= 0) {
      // Update quantity if product exists
      cart!.products[existingProductIndex].quantity += payload.quantity;
    } else {
      // Add new product to cart
      cart!.products.push({
        productId: payload.productId,
        quantity: payload.quantity,
      });
    }

    // Update cart in store
    const [updateError, updatedCart] = await handleAsync(
      this.updateUserCart(userId, cart!)
    );
    if (updateError) {
      logError(updateError, "CartService.addToCart");
      throw new AppError("Failed to update cart", ErrorCode.CART_ERROR, 500);
    }

    return updatedCart!;
  }

  // Handle remove from cart action
  async removeFromCart(payload: RemoveFromCartRequest): Promise<Cart> {
    // Use a fixed userId for demo purposes
    const userId = 1;

    // Get the current cart
    const [cartError, cart] = await handleAsync(this.getUserCart(userId));
    if (cartError) {
      logError(cartError, "CartService.removeFromCart");
      throw new AppError("Failed to get user cart", ErrorCode.CART_ERROR, 500);
    }

    // Remove product from cart
    cart!.products = cart!.products.filter(
      (item) => item.productId !== payload.productId
    );

    // Update cart in store
    const [updateError, updatedCart] = await handleAsync(
      this.updateUserCart(userId, cart!)
    );
    if (updateError) {
      logError(updateError, "CartService.removeFromCart");
      throw new AppError("Failed to update cart", ErrorCode.CART_ERROR, 500);
    }

    return updatedCart!;
  }

  // Handle get cart action
  async getCart(): Promise<Cart> {
    // Use a fixed userId for demo purposes
    const userId = 1;

    // Get the current cart
    const [error, cart] = await handleAsync(this.getUserCart(userId));
    if (error) {
      logError(error, "CartService.getCart");
      throw new AppError("Failed to get user cart", ErrorCode.CART_ERROR, 500);
    }

    return cart!;
  }

  // Handle create cart action
  async createCart(payload: CreateCartRequest): Promise<Cart> {
    const { userId, products } = payload;

    // Create a new cart
    const newCart: Omit<Cart, "id"> = {
      userId,
      date: new Date().toISOString(),
      products,
    };

    // Call the API to create the cart
    const [error, createdCart] = await handleAsync(cartApi.createCart(newCart));

    if (error) {
      logError(error, "CartService.createCart");

      // If API fails, create a local cart
      const localCart: Cart = {
        id: Date.now(), // Generate a temporary ID
        ...newCart,
      };

      cartStore[userId] = localCart;
      return localCart;
    }

    // Store in our local cart store
    cartStore[userId] = createdCart!;
    return createdCart!;
  }

  // Handle update cart action
  async updateCart(payload: UpdateCartRequest): Promise<Cart> {
    const { cartId, products } = payload;

    // Find the cart by ID in our store
    const existingCart = Object.values(cartStore).find(
      (cart) => cart.id === cartId
    );

    if (!existingCart) {
      throw new AppError(
        `Cart with ID ${cartId} not found`,
        ErrorCode.NOT_FOUND,
        404
      );
    }

    // Update the cart
    const updatedCart: Cart = {
      ...existingCart,
      products,
      date: new Date().toISOString(),
    };

    // Call the API to update the cart
    const [error] = await handleAsync(cartApi.updateCart(cartId, { products }));

    if (error) {
      logError(error, "CartService.updateCart");
      // If API fails, just update the local cart
    }

    // Update our local store
    cartStore[existingCart.userId] = updatedCart;
    return updatedCart;
  }

  // Handle delete cart action
  async deleteCart(payload: DeleteCartRequest): Promise<DeleteCartResponse> {
    const { cartId } = payload;

    // Find the cart by ID in our store
    const existingCart = Object.values(cartStore).find(
      (cart) => cart.id === cartId
    );

    if (!existingCart) {
      return {
        success: false,
        message: `Cart with ID ${cartId} not found`,
      };
    }

    // Call the API to delete the cart
    const [error, result] = await handleAsync(cartApi.deleteCart(cartId));

    if (error) {
      logError(error, "CartService.deleteCart");

      // If API fails, just delete from local store
      delete cartStore[existingCart.userId];

      return {
        success: true,
        message: "Cart deleted from local store",
      };
    }

    // Remove from our local store
    if (result!.success) {
      delete cartStore[existingCart.userId];
    }

    return result!;
  }

  // Initialize a user's cart
  async initializeUserCart(userId: number): Promise<Cart> {
    if (!cartStore[userId]) {
      // Try to get cart from API first
      const [error, apiCart] = await handleAsync(cartApi.getUserCart(userId));

      if (error) {
        logError(error, "CartService.initializeUserCart");

        // If API fails, create an empty cart
        cartStore[userId] = {
          id: Date.now(),
          userId,
          date: new Date().toISOString(),
          products: [],
        };
      } else {
        cartStore[userId] = apiCart!;
      }
    }
    return cartStore[userId];
  }

  // Get a user's cart
  async getUserCart(userId: number): Promise<Cart> {
    if (!cartStore[userId]) {
      await this.initializeUserCart(userId);
    }
    return cartStore[userId];
  }

  // Update a user's cart
  async updateUserCart(userId: number, cart: Cart): Promise<Cart> {
    // Update local cart store
    cartStore[userId] = {
      ...cart,
      date: new Date().toISOString(),
    };

    // In a real app, we would persist to a database here
    // For demo purposes, we're just returning the updated cart
    return cartStore[userId];
  }
}

import axios from "axios";
import { config } from "../config";
import { User, Product, Cart, LoginRequest } from "../../../shared/src/types";

// Create axios instance for Fake Store API
const api = axios.create({
  baseURL: config.fakeStoreApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<{ token: string }> => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  getProfile: async (token: string): Promise<User> => {
    const response = await api.get("/users/1", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${category}`);
    return response.data;
  },

  getAllCategories: async (): Promise<string[]> => {
    const response = await api.get("/products/categories");
    return response.data;
  },
};

// Cart API
export const cartApi = {
  getUserCart: async (userId: number): Promise<Cart> => {
    const response = await api.get(`/carts/user/${userId}`);
    // The API returns an array of carts, but we only need the most recent one
    const carts = response.data;
    return carts.length > 0
      ? carts[0]
      : { userId, products: [], date: new Date().toISOString() };
  },

  createCart: async (cart: Omit<Cart, "id">): Promise<Cart> => {
    const response = await api.post("/carts", cart);
    return response.data;
  },

  updateCart: async (cartId: number, cart: Partial<Cart>): Promise<Cart> => {
    const response = await api.put(`/carts/${cartId}`, cart);
    return response.data;
  },

  deleteCart: async (
    cartId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/carts/${cartId}`);
    // The Fake Store API returns the deleted cart on success
    return {
      success: !!response.data,
      message: response.data
        ? "Cart deleted successfully"
        : "Failed to delete cart",
    };
  },

  addToCart: async (cart: Cart): Promise<Cart> => {
    // The Fake Store API doesn't actually update carts persistently
    // So we're simulating this functionality
    const response = await api.post("/carts", cart);
    return response.data;
  },
};

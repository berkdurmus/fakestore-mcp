import { z } from "zod";

// User Schema
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
  name: z.object({
    firstname: z.string(),
    lastname: z.string(),
  }),
  address: z.object({
    city: z.string(),
    street: z.string(),
    number: z.number(),
    zipcode: z.string(),
    geolocation: z.object({
      lat: z.string(),
      long: z.string(),
    }),
  }),
  phone: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Product Schema
export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number(),
    count: z.number(),
  }),
});

export type Product = z.infer<typeof ProductSchema>;

// Cart Schema
export const CartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
});

export const CartSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  date: z.string(),
  products: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
    })
  ),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// MCP Request/Response Schemas
export const LoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});

export const AddToCartRequestSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
});

export const RemoveFromCartRequestSchema = z.object({
  productId: z.number(),
});

export const GetCartResponseSchema = CartSchema;

export const CreateCartRequestSchema = z.object({
  userId: z.number(),
  products: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
    })
  ),
});

export const UpdateCartRequestSchema = z.object({
  cartId: z.number(),
  products: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
    })
  ),
});

export const DeleteCartRequestSchema = z.object({
  cartId: z.number(),
});

export const DeleteCartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;
export type RemoveFromCartRequest = z.infer<typeof RemoveFromCartRequestSchema>;
export type GetCartResponse = z.infer<typeof GetCartResponseSchema>;
export type CreateCartRequest = z.infer<typeof CreateCartRequestSchema>;
export type UpdateCartRequest = z.infer<typeof UpdateCartRequestSchema>;
export type DeleteCartRequest = z.infer<typeof DeleteCartRequestSchema>;
export type DeleteCartResponse = z.infer<typeof DeleteCartResponseSchema>;

// API Error Schema
export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Store Statistics Schema
export const CategoryStatsSchema = z.object({
  name: z.string(),
  productCount: z.number(),
  totalCost: z.number(),
  averagePrice: z.number(),
});

export const StoreStatsSchema = z.object({
  totalProducts: z.number(),
  totalCost: z.number(),
  averagePrice: z.number(),
  categories: z.array(CategoryStatsSchema),
});

export type CategoryStats = z.infer<typeof CategoryStatsSchema>;
export type StoreStats = z.infer<typeof StoreStatsSchema>;

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

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

export interface MCPRequestPayload {
  [key: string]: unknown;
}

export interface MCPResponse {
  type: string;
  action: MCPActionType;
  payload: unknown;
  requestId: string;
  timestamp: number;
}

export interface AgentAction {
  action: MCPActionType;
  payload: unknown;
}

export interface AgentPlan {
  thoughts: string;
  actions: AgentAction[];
}

export interface StructuredResponse {
  reasoning: string;
  items: Product[];
  text: string;
}

export interface AgentResponse {
  query: string;
  plan: {
    thoughts: string;
    actions: any[];
  };
  actions: {
    action: string;
    result: any;
  }[];
  response: string;
  structuredResponse: StructuredResponse;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartItem[];
}

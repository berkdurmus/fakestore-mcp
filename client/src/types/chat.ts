import { Product } from "./api";

export type ActionResult = {
  action: string;
  result: unknown;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: Product[];
  agentDetails?: {
    plan?: {
      thoughts: string;
      actions: unknown[];
    };
    actions: ActionResult[];
    reasoning?: string;
  };
};

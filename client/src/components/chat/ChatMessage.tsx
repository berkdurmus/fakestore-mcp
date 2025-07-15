import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { AgentDetailsDialog } from "./AgentDetailsDialog";
import { ProductCard } from "../ProductCard";
import { Product } from "../../types/api";

interface ChatMessageProps {
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
    actions: Array<{
      action: string;
      result: unknown;
    }>;
    reasoning?: string;
  };
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatMessage = ({
  id,
  role,
  content,
  products,
  agentDetails,
  onSuggestionClick,
}: ChatMessageProps) => {
  return (
    <div className="group animate-fadeIn">
      <div className="flex items-start gap-3 px-4">
        {/* Avatar */}
        <Avatar className="mt-1 h-8 w-8">
          {role === "user" ? (
            <AvatarFallback className="bg-primary text-primary-foreground">
              U
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src="/bot-avatar.png" alt="AI Assistant" />
              <AvatarFallback className="bg-primary/10 text-primary">
                AI
              </AvatarFallback>
            </>
          )}
        </Avatar>

        {/* Message content */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="mb-1 font-medium">
              {role === "user" ? "You" : "FakeStore AI"}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </div>

          {/* Products grid */}
          {products && products.length > 0 && (
            <div className="mt-4 rounded-linear border border-border p-4 bg-card/30">
              <h3 className="font-medium text-sm mb-4">
                Products ({products.length})
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onSuggestionClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agent details */}
          {agentDetails && (
            <AgentDetailsDialog
              plan={agentDetails.plan}
              actions={agentDetails.actions}
              reasoning={agentDetails.reasoning}
            />
          )}
        </div>
      </div>

      <Separator className="my-6" />
    </div>
  );
};

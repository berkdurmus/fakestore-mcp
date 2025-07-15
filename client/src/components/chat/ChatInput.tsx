import React, { FormEvent, forwardRef } from "react";
import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, isLoading }, ref) => {
    return (
      <div className="border-t bg-card/80 backdrop-blur-md">
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl p-4">
          <div className="relative">
            <Input
              ref={ref}
              type="text"
              placeholder="Ask anything about products..."
              value={value}
              onChange={onChange}
              disabled={isLoading}
              className="pr-20 py-6 bg-background shadow-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!value.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Powered by GPT-4o-mini · Designed to help find products
          </p>
        </form>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";

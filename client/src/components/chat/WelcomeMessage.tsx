import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/button";

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

export const WelcomeMessage = ({ onSuggestionClick }: WelcomeMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-4">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Welcome to FakeStore AI
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Ask me anything about our products. I can help you find items, compare
        prices, and discover the perfect product for your needs.
      </p>
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={() =>
            onSuggestionClick("What's the cheapest men's clothing?")
          }
          className="justify-start"
        >
          Find cheapest men's clothing
        </Button>
        <Button
          variant="outline"
          onClick={() => onSuggestionClick("Show me jewelry items")}
          className="justify-start"
        >
          Show me jewelry items
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            onSuggestionClick("What's the most expensive electronic?")
          }
          className="justify-start"
        >
          Most expensive electronics
        </Button>
        <Button
          variant="outline"
          onClick={() => onSuggestionClick("List women's clothing under $30")}
          className="justify-start"
        >
          Women's clothing under $30
        </Button>
      </div>
    </div>
  );
};

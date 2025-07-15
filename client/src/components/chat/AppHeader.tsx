import React from "react";
import { ShoppingBag, ExternalLink } from "lucide-react";

interface AppHeaderProps {
  onClearChat: () => void;
}

export const AppHeader = ({ onClearChat }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4">
        <button
          onClick={onClearChat}
          className="group flex items-center gap-2 rounded-md px-2 py-1 transition-all hover:bg-primary/5"
          aria-label="Clear chat"
        >
          <ShoppingBag className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <h1 className="text-xl font-semibold tracking-tight group-hover:text-primary">
            FakeStore AI
          </h1>
        </button>
        <a
          href="https://github.com/yourusername/fakestore-mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
};

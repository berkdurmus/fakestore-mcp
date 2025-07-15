import React from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface LoadingMessageProps {
  thoughtProcess: string | null;
}

export const LoadingMessage = ({ thoughtProcess }: LoadingMessageProps) => {
  return (
    <div className="flex items-start gap-3 px-4 animate-fadeIn">
      <Avatar className="mt-1 h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="mb-1 font-medium">FakeStore AI</div>

        {/* Thought process display */}
        {thoughtProcess ? (
          <div className="text-sm leading-relaxed whitespace-pre-line bg-muted/50 rounded-md p-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Thought Process</span>
            </div>
            <div className="text-sm text-muted-foreground animate-typing">
              {thoughtProcess}
            </div>
          </div>
        ) : null}

        {/* Skeleton loading */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-12 rounded bg-muted animate-pulse"></div>
          <div className="h-4 w-64 rounded bg-muted animate-pulse"></div>
          <div className="h-4 w-40 rounded bg-muted animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { ScrollArea } from "../ui/scroll-area";
import { WelcomeMessage } from "./WelcomeMessage";
import { ChatMessage } from "./ChatMessage";
import { LoadingMessage } from "./LoadingMessage";
import { Message } from "../../types/chat";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  thoughtProcess: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatContainer = ({
  messages,
  isLoading,
  thoughtProcess,
  messagesEndRef,
  onSuggestionClick,
}: ChatContainerProps) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-6 pb-20">
        {/* Welcome message */}
        {messages.length === 0 && (
          <WelcomeMessage onSuggestionClick={onSuggestionClick} />
        )}

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            id={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            products={message.products}
            agentDetails={message.agentDetails}
            onSuggestionClick={onSuggestionClick}
          />
        ))}

        {/* Loading indicator with thought process */}
        {isLoading && <LoadingMessage thoughtProcess={thoughtProcess} />}

        {/* Reference for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

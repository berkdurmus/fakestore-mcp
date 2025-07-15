import React, { useState, useRef, useEffect } from "react";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import AgentService from "./services/api";
import type { Product } from "./types/api";
import { Message } from "./types/chat";
import { AppHeader, ChatContainer, ChatInput } from "./components/chat";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Add a new state for tracking thought process
  const [thoughtProcess, setThoughtProcess] = useState<string | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Helper function to set input and submit form automatically
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);

    // Use setTimeout to ensure the input value is set before submitting
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form && !isLoading) {
        // Create and dispatch a submit event
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }
    }, 10);
  };

  // Update the handleClearChat function with a better toast
  const handleClearChat = () => {
    if (messages.length === 0) return;

    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();

    toast({
      title: "Chat cleared",
      description: "Your conversation has been reset.",
      variant: "default",
    });
  };

  // Handle submit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setThoughtProcess(null);

    // Use streaming API for real-time thought process
    const stream = AgentService.streamQueryProcess(userMessage.content, {
      onThoughts: (thoughts) => {
        setThoughtProcess(thoughts);
      },
      onAction: (actionData) => {
        // Optional: You could update UI to show each action as it happens
        console.log("Action completed:", actionData);
      },
      onComplete: (response) => {
        setIsLoading(false);

        // Use structured response if available
        let relevantProducts: Product[] = [];

        if (
          response.structuredResponse &&
          Array.isArray(response.structuredResponse.items)
        ) {
          // Use the items array directly from the structured response
          relevantProducts = response.structuredResponse.items;
        }

        // Create an AI response from the structured response text
        const cleanedResponse =
          response.structuredResponse?.text || response.response;

        // Add assistant message
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: cleanedResponse,
          timestamp: new Date(),
          products: relevantProducts.length > 0 ? relevantProducts : undefined,
          agentDetails: {
            plan: response.plan,
            actions: response.actions,
            reasoning: response.structuredResponse?.reasoning,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setThoughtProcess(null);
      },
      onError: (error) => {
        console.error("Error processing query:", error);

        // Add error message
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        setThoughtProcess(null);
      },
    });
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground antialiased">
      {/* Header */}
      <AppHeader onClearChat={handleClearChat} />

      {/* Chat Area */}
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        thoughtProcess={thoughtProcess}
        messagesEndRef={messagesEndRef}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Input Area */}
      <ChatInput
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      <Toaster />
    </div>
  );
}

export default App;

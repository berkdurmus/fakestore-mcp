import axios from "axios";
import type { AgentResponse } from "../types/api";
import to from "await-to-js";

// Server URL from environment variable or fallback
// Cast import.meta to any to avoid TypeScript error with env
const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

// Create API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AgentService = {
  /**
   * Process a user query through the LLM agent
   */
  async processQuery(query: string): Promise<AgentResponse> {
    const [err, response] = await to(api.post("/agent/query", { query }));

    if (err) {
      console.error("Error processing query:", err);
      throw err;
    }

    return response.data;
  },

  /**
   * Process a user query through the LLM agent with streaming updates
   */
  streamQueryProcess(
    query: string,
    callbacks: {
      onThoughts?: (thoughts: string) => void;
      onAction?: (action: any) => void;
      onComplete?: (response: AgentResponse) => void;
      onError?: (error: any) => void;
    }
  ) {
    // Create an AbortController for cleanup
    const controller = new AbortController();

    // Start the streaming process
    const startStream = async () => {
      // Send the initial request
      const [fetchErr, response] = await to(
        fetch(`${API_URL}/agent/query/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })
      );

      // Handle fetch errors
      if (fetchErr || !response || !response.ok) {
        const errorMessage = fetchErr
          ? fetchErr.message
          : `HTTP error! status: ${response?.status || "unknown"}`;

        if (callbacks.onError) {
          callbacks.onError(errorMessage || "Failed to connect to server");
        }
        return;
      }

      // Get the reader from the response body
      const reader = response.body?.getReader();
      if (!reader) {
        if (callbacks.onError) {
          callbacks.onError("Cannot read stream");
        }
        return;
      }

      // Set up the text decoder and buffer
      const decoder = new TextDecoder();
      let buffer = "";

      // Process the stream
      const processStream = async () => {
        while (true) {
          // Read the next chunk
          const [readErr, result] = await to(reader.read());

          // Handle read errors
          if (readErr) {
            if (callbacks.onError) {
              callbacks.onError(readErr.message || "Error reading stream");
            }
            break;
          }

          // Check if we're done
          if (result.done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(result.value, { stream: true });

          // Process lines in buffer
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("event:")) continue;

            // Extract event type and data
            const eventType = line.match(/event: (.+)/)?.[1];
            const data = line.match(/data: (.+)/)?.[1];

            if (!eventType || !data) continue;

            try {
              const parsedData = JSON.parse(data);

              // Handle different event types
              switch (eventType) {
                case "thoughts":
                  if (callbacks.onThoughts) {
                    callbacks.onThoughts(parsedData.thoughts);
                  }
                  break;
                case "action":
                  if (callbacks.onAction) {
                    callbacks.onAction(parsedData);
                  }
                  break;
                case "complete":
                  if (callbacks.onComplete) {
                    callbacks.onComplete(parsedData);
                  }
                  break;
                case "error":
                  if (callbacks.onError) {
                    callbacks.onError(parsedData.error || "Unknown error");
                  }
                  break;
              }
            } catch (parseErr) {
              console.error("Error parsing data:", parseErr);
            }
          }
        }
      };

      // Start processing the stream
      processStream().catch((err) => {
        if (callbacks.onError) {
          callbacks.onError(err.message || "Error processing stream");
        }
      });
    };

    // Start the streaming process
    startStream().catch((err) => {
      if (callbacks.onError) {
        callbacks.onError(err.message || "Failed to start stream");
      }
    });

    // Return a function to abort the fetch if needed
    return {
      close: () => controller.abort(),
    };
  },
};

export default AgentService;

import { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { AgentService } from "../services/agent.service";
import { ResponseHandlerService } from "../services/response.handler.service";
import { StreamingService } from "../services/streaming.service";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export class AgentController {
  private agentService: AgentService;
  private responseHandler: ResponseHandlerService;
  private streamingService: StreamingService;

  constructor() {
    // Initialize services
    this.agentService = new AgentService();
    this.responseHandler = new ResponseHandlerService(
      this.agentService.getMCPActionService()
    );
    this.streamingService = new StreamingService(this.agentService);
  }

  /**
   * Process a user query from the frontend
   */
  processQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, sessionId = "default" } = req.body;

      if (!query || typeof query !== "string") {
        res
          .status(400)
          .json({ error: "Query is required and must be a string" });
        return;
      }

      // Add the user message to conversation history
      this.agentService.addUserMessageToHistory(sessionId, query);

      // Generate action plan
      const plan = await this.agentService.generateActionPlan(sessionId);
      console.log("LLM plan:", JSON.stringify(plan, null, 2));

      // Execute the action plan
      const actionResults = await this.agentService.executeActionPlan(plan);

      // Generate a response based on action results
      const responseText = await this.agentService.generateResponse(
        sessionId,
        actionResults
      );

      // Parse the response
      const structuredResponse = await this.responseHandler.parseResponse(
        responseText,
        actionResults
      );

      // Add the AI's response to the conversation history
      this.agentService.addAIMessageToHistory(
        sessionId,
        structuredResponse.text
      );

      // Return complete response to frontend
      res.json({
        query,
        plan,
        actions: actionResults,
        response: structuredResponse.text,
        structuredResponse,
      });
    } catch (error: any) {
      console.error("Error processing agent query:", error);
      res.status(500).json({
        error:
          error.message || "An error occurred while processing your request",
      });
    }
  };

  /**
   * Process a user query with streaming for real-time thought process
   */
  processQueryStream = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, sessionId = "default" } = req.body;

      if (!query || typeof query !== "string") {
        res
          .status(400)
          .json({ error: "Query is required and must be a string" });
        return;
      }

      // Initialize the stream
      this.streamingService.initializeStream(res);

      // Process the streaming request
      await this.streamingService.processStream(res, sessionId, query);
    } catch (error: any) {
      console.error("Error processing streaming query:", error);

      // Send error response
      if (!res.headersSent) {
        res.status(500).json({
          error:
            error.message || "An error occurred while processing your request",
        });
      } else {
        // If headers already sent, use streaming error
        this.streamingService.sendError(
          res,
          error.message || "An error occurred while processing your request"
        );
        res.end();
      }
    }
  };
}

import { Response } from "express";
import { MCPActionType } from "../../../shared/src/mcp";
import { AgentService } from "./agent.service";
import {
  ResponseHandlerService,
  StructuredResponse,
} from "./response.handler.service";

export class StreamingService {
  private agentService: AgentService;
  private responseHandler: ResponseHandlerService;

  constructor(agentService: AgentService) {
    this.agentService = agentService;
    this.responseHandler = new ResponseHandlerService(
      agentService.getMCPActionService()
    );
  }

  /**
   * Initialize SSE stream
   */
  initializeStream(res: Response): void {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Make sure headers are sent right away
  }

  /**
   * Send thoughts event
   */
  sendThoughts(res: Response, thoughts: string): void {
    res.write(
      `event: thoughts\ndata: ${JSON.stringify({
        thoughts,
      })}\n\n`
    );
  }

  /**
   * Send action result event
   */
  sendActionResult(res: Response, action: MCPActionType, result: any): void {
    res.write(
      `event: action\ndata: ${JSON.stringify({
        action,
        result,
      })}\n\n`
    );
  }

  /**
   * Send error event
   */
  sendError(res: Response, error: string | object): void {
    res.write(
      `event: error\ndata: ${JSON.stringify(
        typeof error === "string" ? { error } : error
      )}\n\n`
    );
  }

  /**
   * Send complete event
   */
  sendComplete(
    res: Response,
    query: string,
    plan: any,
    actions: any[],
    structuredResponse: StructuredResponse
  ): void {
    res.write(
      `event: complete\ndata: ${JSON.stringify({
        query,
        plan,
        actions,
        response: structuredResponse.text,
        structuredResponse,
      })}\n\n`
    );

    res.end();
  }

  /**
   * Execute streaming process
   */
  async processStream(
    res: Response,
    sessionId: string,
    query: string
  ): Promise<void> {
    try {
      // Add user message to conversation history
      this.agentService.addUserMessageToHistory(sessionId, query);

      // Generate action plan
      const plan = await this.agentService.generateActionPlan(sessionId);

      // Send thoughts
      if (plan.thoughts) {
        this.sendThoughts(res, plan.thoughts);
      }

      // Execute each action in the plan
      const actionResults = [];
      for (const actionStep of plan.actions) {
        try {
          const actionType = actionStep.action as MCPActionType;
          const result = await this.agentService
            .getMCPActionService()
            .executeAction(actionType, actionStep.payload);

          actionResults.push({ action: actionType, result });
          this.sendActionResult(res, actionType, result);
        } catch (error: any) {
          const errorResult = {
            action: actionStep.action,
            error: error.message,
          };

          actionResults.push(errorResult);
          this.sendError(res, errorResult);
        }
      }

      // Generate final response
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

      // Send final complete event
      this.sendComplete(res, query, plan, actionResults, structuredResponse);
    } catch (error: any) {
      console.error("Error in streaming process:", error);
      this.sendError(
        res,
        error.message || "Unknown error in streaming process"
      );
      res.end();
    }
  }
}

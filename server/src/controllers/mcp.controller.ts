import { Request, Response } from "express";
import { MCPService } from "../services/mcp.service";

// Create a singleton instance of the MCP service
const mcpService = new MCPService();

export class MCPController {
  // Handle MCP POST requests
  async handleMCPRequest(req: Request, res: Response): Promise<void> {
    try {
      // Process the MCP request
      const mcpResponse = await mcpService.handleRequest(req.body);

      // Return the MCP response
      res.json(mcpResponse);
    } catch (error: any) {
      // Log error
      console.error("Error in MCP controller:", error);

      // Return 500 Internal Server Error
      res.status(500).json({
        type: "error",
        error: {
          message: error.message || "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        },
        requestId: req.body?.requestId || "",
        timestamp: Date.now(),
      });
    }
  }
}

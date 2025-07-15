import { Router } from "express";
import { MCPController } from "./controllers";
import { validateMCPRequestMiddleware } from "./middleware";
import { AgentController } from "./controllers/agent.controller";

const router = Router();
const mcpController = new MCPController();
const agentController = new AgentController();

// MCP endpoint
router.post(
  "/mcp",
  validateMCPRequestMiddleware,
  mcpController.handleMCPRequest
);

// Agent endpoint for the React UI
router.post("/agent/query", agentController.processQuery);

// Streaming agent endpoint for real-time thought process
router.post("/agent/query/stream", agentController.processQueryStream);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

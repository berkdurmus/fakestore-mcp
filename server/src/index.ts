import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { config } from "./config";
import routes from "./routes";
import { MCPActionType } from "../../shared/src/mcp";

// Load environment variables from the server/.env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add routes
app.use("/api", routes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
      error: {
        message: err.message || "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
);

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
  console.log(`MCP endpoint available at http://localhost:${port}/api/mcp`);

  // Log info about available MCP capabilities
  console.log("\nAvailable MCP Actions:");
  Object.values(MCPActionType).forEach((action) => {
    console.log(`- ${action}`);
  });

  console.log(
    "\nTo discover all available options, use the getAvailableOptions action"
  );
  console.log(
    "OpenAI API Key Status:",
    process.env.OPENAI_API_KEY ? "Configured" : "Missing"
  );
});

export default app;

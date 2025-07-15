import { Request, Response, NextFunction } from "express";
import { validateMCPRequest } from "../../../shared/src/mcp";

// Middleware to validate MCP requests
export const validateMCPRequestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate the request body against MCP schema
    const validatedRequest = validateMCPRequest(req.body);

    // Attach the validated request to the request object for handlers to use
    req.body = validatedRequest;

    next();
  } catch (error: any) {
    // Return validation error as HTTP 400
    res.status(400).json({
      error: {
        message: error.message || "Invalid MCP request",
        code: "VALIDATION_ERROR",
      },
    });
  }
};

// Extend Express Request interface to include validated MCP request
declare global {
  namespace Express {
    interface Request {
      validatedMCPRequest?: any;
    }
  }
}

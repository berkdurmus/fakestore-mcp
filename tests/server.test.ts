// Use older version of node-fetch compatible with CommonJS
import fetch from "node-fetch";
import {
  MCPActionType,
  MCPMessageType,
  createMCPRequest,
  MCPResponse,
  MCPError,
} from "../shared/src/mcp";
import { Product } from "../shared/src/types";

// Define types for API responses
interface HealthResponse {
  status: string;
  timestamp: string;
}

// Create a type that extends MCPResponse for products
interface ProductsResponse extends MCPResponse {
  payload: Product[];
}

// Server URL
const SERVER_URL = "http://localhost:3001/api/mcp";

// Test MCP server
async function testMCPServer() {
  try {
    // Test health endpoint
    console.log("Testing health endpoint...");
    const healthResponse = await fetch("http://localhost:3001/api/health");
    const healthData = (await healthResponse.json()) as HealthResponse;

    if (healthData.status === "ok") {
      console.log("✅ Health check passed!");
    } else {
      console.error("❌ Health check failed!", healthData);
      return;
    }

    // Test getting products
    console.log("\nTesting get products...");
    const getProductsRequest = createMCPRequest(
      MCPActionType.GET_PRODUCTS,
      undefined
    );

    const productsResponse = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getProductsRequest),
    });

    const productsData = (await productsResponse.json()) as ProductsResponse;

    if (
      productsData.type === MCPMessageType.RESPONSE &&
      Array.isArray(productsData.payload)
    ) {
      console.log(
        `✅ Get products successful! Received ${productsData.payload.length} products.`
      );

      // Log the first product
      if (productsData.payload.length > 0) {
        console.log("\nSample product:");
        console.log(JSON.stringify(productsData.payload[0], null, 2));
      }
    } else {
      console.error("❌ Get products failed!", productsData);
    }

    // Test login with fake credentials (should fail)
    console.log("\nTesting login with fake credentials (should fail)...");
    const loginRequest = createMCPRequest(MCPActionType.LOGIN, {
      username: "fake_user",
      password: "fake_password",
    });

    const loginResponse = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginRequest),
    });

    const loginData = (await loginResponse.json()) as MCPError;

    if (loginData.type === MCPMessageType.ERROR) {
      console.log("✅ Login correctly failed with invalid credentials!");
    } else {
      console.error(
        "❌ Login unexpectedly succeeded with fake credentials!",
        loginData
      );
    }

    // Overall test result
    console.log("\n✅ Basic MCP server tests completed!");
  } catch (error) {
    console.error("❌ Tests failed with error:", error);
  }
}

// Run the tests if the server is running
console.log("🧪 Starting MCP server tests...");
testMCPServer();

import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { MCPActionType } from "../../../shared/src/mcp";
import { MCPActionService } from "./mcp.action.service";

type Message = HumanMessage | AIMessage | SystemMessage;

export class AgentService {
  private model: ChatOpenAI;
  private apiCapabilities: any = null;
  private conversationHistory: Map<string, Array<Message>> = new Map();
  private mcpActionService: MCPActionService;

  constructor() {
    // Initialize the LLM model
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini", // You can change this to a more powerful model if needed
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.mcpActionService = new MCPActionService();

    // Initialize API capabilities
    this.discoverApiCapabilities().catch((err) => {
      console.error("Failed to discover API capabilities:", err);
    });
  }

  /**
   * Discover API capabilities to use in agent context
   */
  private async discoverApiCapabilities(): Promise<void> {
    try {
      console.log("Discovering API capabilities...");

      // Get available options through MCP action service
      this.apiCapabilities = await this.mcpActionService.executeAction(
        MCPActionType.GET_AVAILABLE_OPTIONS,
        undefined
      );

      console.log("Discovered API capabilities");
    } catch (error: any) {
      console.error("Error discovering API capabilities:", error.message);
      throw error;
    }
  }

  /**
   * Get or initialize conversation history for a session
   */
  getOrCreateConversationHistory(sessionId: string): Array<Message> {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, [
        new SystemMessage(`You are an AI shopping assistant for an e-commerce store.
Your task is to help users find and interact with products through the Model Context Protocol (MCP).
You can directly make API calls to the MCP server to fulfill user requests.

Here's how you should respond:
1. Analyze the user's request
2. Decide which MCP actions to use
3. Make the appropriate API calls
4. Process the data and respond to the user

NEVER make up information. Only use data from actual API calls.
If you're unsure about something, ask for clarification.

IMPORTANT: When a user asks about available categories, ALWAYS use the getAvailableOptions action and then list the specific product categories by name from the response.`),
      ]);

      // Add API capabilities if available
      if (this.apiCapabilities) {
        this.conversationHistory.get(sessionId)!.push(
          new SystemMessage(`You have access to the following MCP API capabilities:
      
Available actions: ${this.apiCapabilities.availableActions.join(", ")}
Product categories: ${this.apiCapabilities.productCategories.join(", ")}

Here are examples of how you can use these actions:
1. To get all products: Use getProducts action with no payload (payload should be empty)
2. To get product details: Use getProduct action with a product ID
3. To add to cart: Use addToCart action with productId and quantity
4. To view cart: Use getCart action with no payload (payload should be empty)
5. To get store statistics: Use getStoreStats action with no payload (payload should be empty)
6. To get available options and categories: Use getAvailableOptions action with no payload (payload should be empty)

IMPORTANT: The following actions require NO PAYLOAD (leave payload as an empty object):
- getProducts
- getCart
- getStoreStats
- getAvailableOptions

When responding about categories, always explicitly list each category name from productCategories.

You can execute any of these actions when a user asks for something. Process the results and provide a helpful response.`)
        );
      }
    }

    return this.conversationHistory.get(sessionId)!;
  }

  /**
   * Add a user message to the conversation history
   */
  addUserMessageToHistory(sessionId: string, message: string): void {
    const history = this.getOrCreateConversationHistory(sessionId);
    history.push(new HumanMessage(message));
  }

  /**
   * Add an AI message to the conversation history
   */
  addAIMessageToHistory(sessionId: string, message: string): void {
    const history = this.getOrCreateConversationHistory(sessionId);
    history.push(new AIMessage(message));
  }

  /**
   * Generate an action plan based on user query
   */
  async generateActionPlan(sessionId: string): Promise<any> {
    const history = this.getOrCreateConversationHistory(sessionId);

    // Get initial response from LLM to plan actions
    const planningResponse = await this.model.invoke([
      ...history,
      new SystemMessage(`
Based on the user's request, decide which MCP actions to execute.
Reply with a JSON object that describes the actions you want to take.
Format your response as follows:

\`\`\`json
{
  "thoughts": "Your reasoning about what the user is asking for and how to fulfill it",
  "actions": [
    {
      "action": "ONE_OF_THE_MCP_ACTIONS",
      "payload": { ... payload parameters ... }
    },
    ... more actions if needed ...
  ]
}
\`\`\`

IMPORTANT: Some actions require NO PAYLOAD. For these actions, you MUST use an EMPTY OBJECT {} as the payload:
- getProducts (no payload - use empty object {})
- getCart (no payload - use empty object {})
- getStoreStats (no payload - use empty object {})
- getAvailableOptions (no payload - use empty object {})

Available MCP actions: ${
        this.apiCapabilities?.availableActions.join(", ") ||
        "Not yet initialized"
      }
`),
    ]);

    // Extract JSON from the response
    const planText = planningResponse.content.toString();
    const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      throw new Error("Could not parse action plan from LLM response");
    }

    return JSON.parse(jsonMatch[1]);
  }

  /**
   * Execute all actions in a plan
   */
  async executeActionPlan(plan: any): Promise<any[]> {
    const actionResults = [];

    for (const actionStep of plan.actions) {
      try {
        const actionType = actionStep.action as MCPActionType;
        const result = await this.mcpActionService.executeAction(
          actionType,
          actionStep.payload
        );
        actionResults.push({ action: actionType, result });
      } catch (error: any) {
        actionResults.push({
          action: actionStep.action,
          error: error.message,
        });
      }
    }

    return actionResults;
  }

  /**
   * Generate a response based on action results
   */
  async generateResponse(
    sessionId: string,
    actionResults: any[]
  ): Promise<any> {
    const history = this.getOrCreateConversationHistory(sessionId);

    const responsePrompt = `
Here are the results of the actions you planned:
${JSON.stringify(actionResults, null, 2)}

Based on these results, provide a helpful response to the user's request.
Focus on answering their question directly and providing the information they asked for.
If you had to find something specific (like the cheapest item), make sure to highlight that in your response.

IMPORTANT: If the user asked about available categories, you MUST list ALL the specific category names from the results (don't just mention that categories exist, list each one by name).

IMPORTANT: If the user asked about their cart, include information about the items in the cart, including quantity. For example: "Your cart contains 3 items: Item 1 (qty: 2), Item 2 (qty: 1)..."

You MUST format your response as a JSON object with the following structure:
{
  "reasoning": "Your internal reasoning about how you interpreted the request and found the answer (will not be shown to user)",
  "items": [], // Array of product objects that are relevant to the query. Leave empty if no specific products are relevant
  "text": "Your response text to the user's query. Should be clear, helpful and directly answer their question."
}
`;

    const finalResponse = await this.model.invoke([
      ...history,
      new SystemMessage(responsePrompt),
    ]);

    return finalResponse.content.toString();
  }

  /**
   * Get MCP Action Service
   */
  getMCPActionService(): MCPActionService {
    return this.mcpActionService;
  }

  /**
   * Get Model
   */
  getModel(): ChatOpenAI {
    return this.model;
  }
}

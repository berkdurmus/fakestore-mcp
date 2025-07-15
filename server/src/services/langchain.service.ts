import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { productsApi } from "./index";
import { Product } from "../../../shared/src/types";
import { MCPActionType } from "../../../shared/src/mcp";

/**
 * LangChain service for AI-powered features
 */
export class LangChainService {
  private model: OpenAI;
  private products: Product[] = [];
  private categories: string[] = [];
  private isInitialized = false;

  constructor() {
    // Initialize OpenAI model with API key from environment variables
    this.model = new OpenAI({
      modelName: "gpt-3.5-turbo-instruct", // Using instruct model for better instruction following
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize the service by loading products and categories
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load all products and categories
      [this.products, this.categories] = await Promise.all([
        productsApi.getAll(),
        productsApi.getAllCategories(),
      ]);

      this.isInitialized = true;
      console.log(
        `LangChain service initialized with ${this.products.length} products and ${this.categories.length} categories`
      );
    } catch (error) {
      console.error("Failed to initialize LangChain service:", error);
      throw error;
    }
  }

  /**
   * Process a natural language query to search for products
   */
  async processQuery(query: string): Promise<Product[]> {
    // Ensure products are loaded
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Handle "show all products" type of queries directly
    const showAllProductsPatterns = [
      /show\s+all\s+products/i,
      /all\s+products/i,
      /list\s+all\s+products/i,
      /get\s+all\s+products/i,
      /display\s+all\s+products/i,
      /view\s+all\s+products/i,
    ];

    // Check if the query matches any of the patterns to show all products
    if (showAllProductsPatterns.some((pattern) => pattern.test(query))) {
      console.log("Query recognized as 'show all products' request");
      return this.products;
    }

    // If the OPENAI_API_KEY is not set, use a fallback implementation
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OPENAI_API_KEY not set, using fallback search implementation"
      );
      return this.fallbackQueryProcessing(query);
    }

    // Use LangChain with OpenAI
    try {
      const prompt = new PromptTemplate({
        template: `
          You are a shopping assistant for an e-commerce store.
          Given the following query from a user, identify the search criteria to find matching products.
          Extract criteria like category, price range, gender, style, color, etc.
          Format your response as a valid JSON object with properties that can be used to filter products.

          Use these property names in your JSON:
          - category: string (if mentioned)
          - minPrice: number (if mentioned)
          - maxPrice: number (if mentioned)
          - gender: string (if mentioned)
          - keywords: string[] (important words from the query)
          - color: string (if mentioned)
          - showAll: boolean (set to true if user wants to see all products)
          
          Available categories: {categories}
          Available MCP actions: ${Object.values(MCPActionType).join(", ")}
          
          If the user is asking to show/list/get all products, set showAll to true.
          
          User query: {query}

          Return ONLY the JSON object with no other text.
        `,
        inputVariables: ["query", "categories"],
      });

      const formattedPrompt = await prompt.format({
        query,
        categories: this.categories.join(", "),
      });

      console.log("Sending query to OpenAI:", query);
      const result = await this.model.call(formattedPrompt);
      console.log("OpenAI response:", result);

      // Parse the JSON response
      let criteria;
      try {
        // Try to extract JSON if there's any surrounding text
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : result.trim();
        criteria = JSON.parse(jsonString);
        console.log("Parsed criteria:", criteria);
      } catch (error) {
        console.error("Failed to parse OpenAI response as JSON:", error);
        console.log("Raw response:", result);
        // Return a fallback implementation if parsing fails
        return this.fallbackQueryProcessing(query);
      }

      // Check if showAll flag is set to true
      if (criteria.showAll === true) {
        console.log("LLM determined this is a 'show all products' request");
        return this.products;
      }

      // Apply criteria to filter products
      const filteredProducts = this.filterProductsByCriteria(criteria);

      // If no results, fall back to simple search
      if (filteredProducts.length === 0) {
        console.log("No results from AI filtering, trying fallback search");
        return this.fallbackQueryProcessing(query);
      }

      return filteredProducts;
    } catch (error) {
      console.error("Error processing query with LangChain:", error);
      // Fall back to simple search if LangChain fails
      return this.fallbackQueryProcessing(query);
    }
  }

  /**
   * Get metadata about available MCP actions and store options
   */
  async getAvailableOptions() {
    // Ensure products are loaded
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      availableActions: Object.values(MCPActionType),
      productCategories: this.categories,
      productCount: this.products.length,
    };
  }

  /**
   * Fallback implementation for when OpenAI API is not available
   */
  private fallbackQueryProcessing(query: string): Product[] {
    const lowerQuery = query.toLowerCase();

    // Check for "show all products" request
    const showAllProductsPatterns = [
      /show\s+all/i,
      /all\s+products/i,
      /list\s+all/i,
      /get\s+all/i,
      /display\s+all/i,
      /view\s+all/i,
    ];

    if (showAllProductsPatterns.some((pattern) => pattern.test(lowerQuery))) {
      return this.products;
    }

    // Extract price range if present
    const maxPriceMatch =
      lowerQuery.match(/under\s+\$?(\d+)/i) ||
      lowerQuery.match(/less than\s+\$?(\d+)/i);
    const minPriceMatch =
      lowerQuery.match(/over\s+\$?(\d+)/i) ||
      lowerQuery.match(/more than\s+\$?(\d+)/i);

    const maxPrice = maxPriceMatch ? parseFloat(maxPriceMatch[1]) : Infinity;
    const minPrice = minPriceMatch ? parseFloat(minPriceMatch[1]) : 0;

    // Extract category mentions
    const categoryMatches = this.categories.filter((category) =>
      lowerQuery.includes(category.toLowerCase())
    );

    // Filter products based on extracted criteria
    return this.products.filter((product) => {
      // Check price range
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }

      // Check category if mentioned
      if (
        categoryMatches.length > 0 &&
        !categoryMatches.includes(product.category)
      ) {
        return false;
      }

      // Check general text match
      return (
        product.title.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Filter products based on criteria extracted from the LLM
   */
  private filterProductsByCriteria(criteria: any): Product[] {
    console.log(
      "Filtering products with criteria:",
      JSON.stringify(criteria, null, 2)
    );

    // Simple text search if no structured criteria
    if (!criteria || Object.keys(criteria).length === 0) {
      return [];
    }

    return this.products.filter((product) => {
      // Match category if specified (case insensitive, partial match)
      if (
        criteria.category &&
        typeof criteria.category === "string" &&
        criteria.category.trim() !== ""
      ) {
        const categoryLower = criteria.category.toLowerCase();

        // Check if the category name is in our list of categories
        const matchingCategory = this.categories.find(
          (cat) =>
            cat.toLowerCase().includes(categoryLower) ||
            categoryLower.includes(cat.toLowerCase())
        );

        if (matchingCategory && product.category !== matchingCategory) {
          return false;
        }
      }

      // Match price range if specified
      if (
        criteria.maxPrice &&
        typeof criteria.maxPrice === "number" &&
        product.price > criteria.maxPrice
      ) {
        return false;
      }

      if (
        criteria.minPrice &&
        typeof criteria.minPrice === "number" &&
        product.price < criteria.minPrice
      ) {
        return false;
      }

      // Match other text criteria if specified
      if (
        criteria.keywords &&
        Array.isArray(criteria.keywords) &&
        criteria.keywords.length > 0
      ) {
        const matchesKeywords = criteria.keywords.some((keyword: string) => {
          if (typeof keyword !== "string") return false;
          const keywordLower = keyword.toLowerCase();
          return (
            product.title.toLowerCase().includes(keywordLower) ||
            product.description.toLowerCase().includes(keywordLower) ||
            product.category.toLowerCase().includes(keywordLower)
          );
        });

        if (!matchesKeywords) {
          return false;
        }
      }

      // Handle potential color filtering
      if (
        criteria.color &&
        typeof criteria.color === "string" &&
        criteria.color.trim() !== ""
      ) {
        const colorLower = criteria.color.toLowerCase();
        if (
          !product.description.toLowerCase().includes(colorLower) &&
          !product.title.toLowerCase().includes(colorLower)
        ) {
          return false;
        }
      }

      // Handle gender filtering (men's/women's)
      if (
        criteria.gender &&
        typeof criteria.gender === "string" &&
        criteria.gender.trim() !== ""
      ) {
        const gender = criteria.gender.toLowerCase();
        if (gender.includes("men") || gender.includes("male")) {
          if (
            !product.description.toLowerCase().includes("men") &&
            !product.title.toLowerCase().includes("men") &&
            !product.category.toLowerCase().includes("men")
          ) {
            return false;
          }
        } else if (gender.includes("women") || gender.includes("female")) {
          if (
            !product.description.toLowerCase().includes("women") &&
            !product.title.toLowerCase().includes("women") &&
            !product.category.toLowerCase().includes("women")
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

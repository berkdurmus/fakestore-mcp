# FakeStore MCP with LLM Agent

A modern e-commerce store with a sleek, elegant UI and LLM-powered search capabilities.

## Product Demo (Client + MCP Architecture)
https://www.youtube.com/watch?v=uhaueWv50xg

## Features

- **Beautiful Chat Interface**: Inspired by ChatGPT but with an Apple/Linear.app aesthetic
- **Real-time AI Thought Process**: See the actual LLM reasoning in real-time as it processes queries
- **LLM-Powered Intelligence**: Natural language product search, filtering, and sorting
- **Elegant Product Cards**: Clean, minimalist design showcasing product information
- **Agent Details View**: See exactly how the AI processed your request
- **Responsive Design**: Works beautifully on all devices

## Project Structure

- `server/` - Express.js backend with MCP (Model Context Protocol) implementation
- `client/` - Modern React frontend with shadcn/ui components
- `client/` - CLI client for testing the LLM agent
- `shared/` - Shared types and interfaces

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd client && npm install
   ```
3. Create a `.env` file in the server directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the Application

### Run Everything Together
```
npm run dev:all
```
This will start both the backend server and the React frontend.

### Backend Server Only
```
npm run start:server
```

### Frontend Only
```
npm run frontend:dev
```

### CLI Interface
```
npm run agent
```

## User Interface

The application features a modern, sleek chat interface:

1. **Welcome Screen**: Quick suggestion buttons to help users get started
2. **Chat Messages**: Clean message bubbles with user and AI responses
3. **Live Thought Process**: See the actual reasoning of the LLM in real-time as it analyzes your query
4. **Product Cards**: Elegant cards showing product images, prices, and details
5. **Agent Details**: Expandable dialog showing the LLM's thought process and API calls

## Real-time Thought Process

One of the most innovative features of this application is the ability to see the LLM's actual thought process in real-time as it works through your query. This provides unprecedented transparency into how the AI makes decisions, such as:

- How it interprets user queries
- What API endpoints it chooses to call
- How it determines which filters to apply
- The reasoning behind its product recommendations

This feature is implemented through a streaming server-sent events (SSE) connection that pushes the LLM's thoughts to the frontend as soon as they're available, creating a more engaging and educational user experience.

## Technologies

- **Frontend**: React, TypeScript, shadcn/ui, Tailwind CSS, Lucide icons
- **Backend**: Express.js, TypeScript, OpenAI GPT, LangChain
- **Data**: FakeStore API for product information
- **Streaming**: Server-Sent Events (SSE) for real-time thought process display

## Architecture Diagrams

### System Architecture

```mermaid
flowchart TB
    subgraph "Client"
        UI["React UI"]
        ChatComponent["Chat Components"]
        ApiService["API Service"]
    end
    
    subgraph "Server"
        Express["Express Server"]
        
        subgraph "Controllers"
            MCPController["MCP Controller"]
            AgentController["Agent Controller"]
        end
        
        subgraph "Services"
            MCPService["MCP Service"]
            AgentService["Agent Service"]
            LangChainService["LangChain Service"]
            CartService["Cart Service"]
            StreamingService["Streaming Service"]
            ResponseHandler["Response Handler"]
        end
        
        subgraph "APIs"
            FakeStoreAPI["FakeStore API"]
        end
    end
    
    UI --> ChatComponent
    ChatComponent --> ApiService
    ApiService --> Express
    
    Express --> MCPController & AgentController
    MCPController --> MCPService
    AgentController --> AgentService & StreamingService
    
    AgentService --> MCPService
    AgentService --> LangChainService
    StreamingService --> AgentService
    StreamingService --> ResponseHandler
    MCPService --> CartService
    MCPService --> FakeStoreAPI
    
    FakeStoreAPI -.-> MCPService
    
    %% Define styling
    classDef client fill:#f9f9ff,stroke:#333,stroke-width:1px
    classDef server fill:#e6f3ff,stroke:#333,stroke-width:1px
    classDef controllers fill:#ffeecc,stroke:#333,stroke-width:1px
    classDef services fill:#e1f5e1,stroke:#333,stroke-width:1px
    classDef apis fill:#ffe6e6,stroke:#333,stroke-width:1px
    
    %% Apply styling
    class UI,ChatComponent,ApiService client
    class Express server
    class MCPController,AgentController controllers
    class MCPService,AgentService,LangChainService,CartService,StreamingService,ResponseHandler services
    class FakeStoreAPI apis
```

### Chat Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as Client API Service
    participant Server as Express Server
    participant Agent as Agent Service
    participant LLM as LangChain Service
    participant MCP as MCP Service
    participant FakeStore as FakeStore API
    
    User->>UI: Enter Query
    UI->>API: streamQueryProcess(query)
    API->>Server: POST /agent/query/stream
    Server->>Agent: processQueryStream(query)
    
    Agent->>LLM: generateActionPlan()
    LLM-->>Agent: Return Plan
    Server-->>UI: Stream Thoughts Event
    UI-->>User: Display Real-time Thoughts
    
    loop For Each Action in Plan
        Agent->>MCP: executeAction(action, payload)
        MCP->>FakeStore: Call FakeStore API
        FakeStore-->>MCP: Return Data
        MCP-->>Agent: Return Result
        Server-->>UI: Stream Action Event
    end
    
    Agent->>LLM: generateResponse(results)
    LLM-->>Agent: Return Response Text
    Agent->>Agent: parseResponse(text)
    Server-->>UI: Stream Complete Event
    UI-->>User: Display Final Response
```

### Client Component Architecture

```mermaid
flowchart TD
    subgraph "Client Application"
        App["App Component"]
        
        subgraph "Components"
            AppHeader["AppHeader"]
            ChatContainer["ChatContainer"]
            ChatInput["ChatInput"]
            ChatMessage["ChatMessage"]
            WelcomeMessage["WelcomeMessage"]
            LoadingMessage["LoadingMessage"]
            AgentDetailsDialog["AgentDetailsDialog"]
            ProductCard["ProductCard"]
        end
        
        subgraph "Services"
            ApiService["API Service"]
        end
        
        subgraph "UI Components"
            UIComponents["ShadCN UI Components<br/>(Button, Card, Dialog, etc.)"]
        end
        
        subgraph "Hooks"
            useToast["useToast"]
        end
    end
    
    App --> AppHeader & ChatContainer & ChatInput
    
    ChatContainer --> ChatMessage & WelcomeMessage & LoadingMessage
    ChatMessage --> AgentDetailsDialog
    ChatMessage --> ProductCard
    
    App --> ApiService
    App --> useToast
    
    ChatInput --> UIComponents
    AppHeader --> UIComponents
    ChatMessage --> UIComponents
    AgentDetailsDialog --> UIComponents
    ProductCard --> UIComponents
    
    %% Define styling
    classDef main fill:#f4f4f9,stroke:#333,stroke-width:1px
    classDef component fill:#e6f7ff,stroke:#333,stroke-width:1px
    classDef service fill:#f9f9e0,stroke:#333,stroke-width:1px
    classDef ui fill:#ffe6cc,stroke:#333,stroke-width:1px
    classDef hook fill:#e1f5e1,stroke:#333,stroke-width:1px
    
    %% Apply styling
    class App main
    class AppHeader,ChatContainer,ChatInput,ChatMessage,WelcomeMessage,LoadingMessage,AgentDetailsDialog,ProductCard component
    class ApiService service
    class UIComponents ui
    class useToast hook
```

### MCP (Model Context Protocol) Data Flow

```mermaid
flowchart LR
    subgraph "MCP Protocol"
        MCPRequest["MCP Request"]
        MCPResponse["MCP Response"]
        MCPError["MCP Error"]
    end
    
    subgraph "Action Types"
        Login["LOGIN"]
        GetProducts["GET_PRODUCTS"]
        GetProduct["GET_PRODUCT"]
        AddToCart["ADD_TO_CART"]
        RemoveFromCart["REMOVE_FROM_CART"]
        GetCart["GET_CART"]
        CreateCart["CREATE_CART"]
        UpdateCart["UPDATE_CART"]
        DeleteCart["DELETE_CART"]
        GetStoreStats["GET_STORE_STATS"]
        GetOptions["GET_AVAILABLE_OPTIONS"]
    end
    
    subgraph "Data Models"
        User["User"]
        Product["Product"]
        Cart["Cart"]
        CartItem["CartItem"]
        LoginRequest["LoginRequest"]
        LoginResponse["LoginResponse"]
    end
    
    MCPRequest --> |Contains| Action
    Action --> Login & GetProducts & GetProduct & AddToCart & RemoveFromCart & GetCart & CreateCart & UpdateCart & DeleteCart & GetStoreStats & GetOptions
    
    MCPResponse --> |Returns| ResponsePayload
    MCPError --> |Returns| ErrorDetails
    
    Login --> LoginRequest
    Login --> LoginResponse
    
    LoginResponse --> User
    GetProducts --> Product
    GetProduct --> Product
    GetCart --> Cart
    Cart --> CartItem
    CartItem --> Product
    
    %% Define styling
    classDef protocol fill:#f0f8ff,stroke:#333,stroke-width:1px
    classDef actionType fill:#f9f9e0,stroke:#333,stroke-width:1px
    classDef dataModel fill:#e1f5e1,stroke:#333,stroke-width:1px
    
    %% Apply styling
    class MCPRequest,MCPResponse,MCPError protocol
    class Login,GetProducts,GetProduct,AddToCart,RemoveFromCart,GetCart,CreateCart,UpdateCart,DeleteCart,GetStoreStats,GetOptions actionType
    class User,Product,Cart,CartItem,LoginRequest,LoginResponse dataModel
```

## License

ISC 

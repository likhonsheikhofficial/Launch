# Launch AI Generator
Launch is a powerful system that turns ideas into full, production-ready applications using AI and Python. Through advanced prompt engineering, Launch follows a unique workflow to generate clean, professional Python codebases.Launch is a production-ready system that integrates a LangChain-powered agent within a Flask server environment. The system is designed to be modular, scalable, and secure, with a focus on maintainability and extensibility.

## Features

- **LangChain Agent**: Interactive AI assistant with specialized tools
- **Vector Memory**: FAISS-powered semantic memory for conversation tracking
- **Tool Integration**: Extensible tool registry for agent capabilities
- **Security**: Input validation, output sanitization, and rate limiting
- **Monitoring**: LangSmith integration for tracing and debugging
- **Deployment**: Vercel-ready serverless architecture

## Architecture

The system is built with a modular architecture:

- **Flask Server**: Handles HTTP requests, WebSocket connections, and serves the web interface
- **Agent Manager**: Orchestrates agent creation, execution, and lifecycle management
- **LangChain Agent**: Implements the agent using LangChain Expression Language (LCEL)
- **Memory Manager**: Manages conversation history and vector-based memory using FAISS
- **Tool Registry**: Manages the tools available to the agent
- **LLM Provider**: Integrates with Together AI for language model capabilities

## Prerequisites

- Python 3.9+
- Together AI API key
- LangSmith API key (optional, for monitoring)
- Tavily API key (optional, for search functionality)

## Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/yourusername/launch-ai-generator.git
   cd launch-ai-generator
   \`\`\`

2. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

3. Set up environment variables:
   \`\`\`
   export TOGETHER_API_KEY=your_together_api_key
   export LANGCHAIN_API_KEY=your_langsmith_api_key  # Optional
   export TAVILY_API_KEY=your_tavily_api_key  # Optional
   \`\`\`

4. Run the application:
   \`\`\`
   uvicorn api.index:app --reload
   \`\`\`

5. Open your browser and navigate to `http://localhost:8000`

## Deployment to Vercel

1. Install Vercel CLI:
   \`\`\`
   npm install -g vercel
   \`\`\`

2. Configure environment variables in Vercel:
   \`\`\`
   vercel env add TOGETHER_API_KEY
   vercel env add LANGCHAIN_API_KEY  # Optional
   vercel env add TAVILY_API_KEY  # Optional
   \`\`\`

3. Deploy:
   \`\`\`
   vercel --prod
   \`\`\`

## API Endpoints

### HTTP Endpoints

- `GET /`: Main application page
- `POST /api/generate`: Generate code based on a prompt
- `POST /api/screenshot`: Generate UI from a screenshot
- `GET /api/versions`: Get all saved versions
- `GET /api/version/{timestamp}`: Get a specific version
- `POST /api/agent/chat`: Chat with the agent
- `POST /api/agent/clear-memory`: Clear memory for a session
- `GET /health`: Health check endpoint
- `GET /debug`: Debug endpoint (not available in production)

### WebSocket Endpoints

- `/api/agent/ws/{client_id}`: WebSocket endpoint for streaming agent responses

## Configuration

The application can be configured using environment variables:

### LLM Configuration

- `TOGETHER_API_KEY`: API key for Together AI
- `TOGETHER_MODEL`: Model name (default: "togethercomputer/llama-3-70b-instruct")
- `TOGETHER_TEMPERATURE`: Temperature for generation (default: 0.7)
- `TOGETHER_MAX_TOKENS`: Maximum tokens to generate (default: 2000)

### Agent Configuration

- `AGENT_PROMPT_PATH`: Path to the agent prompt file (default: "prompts/agent_prompt.txt")
- `AGENT_PROMPT`: Fallback prompt if file not found
- `AGENT_MAX_ITERATIONS`: Maximum iterations for the agent (default: 5)
- `AGENT_VERBOSE`: Enable verbose logging (default: false)
- `AGENT_MAX_ACTIVE`: Maximum active agents (default: 100)
- `AGENT_ENABLE_STREAMING`: Enable streaming responses (default: true)

### Memory Configuration

- `MEMORY_USE_VECTOR`: Use vector-based memory (default: true)
- `MEMORY_DIR`: Directory for storing memory (default: "/tmp/launch/memory")
- `MEMORY_K`: Number of relevant items to retrieve (default: 5)
- `EMBEDDINGS_MODEL`: Model for embeddings (default: "sentence-transformers/all-MiniLM-L6-v2")
- `EMBEDDINGS_CACHE_DIR`: Cache directory for embeddings (default: "/tmp/launch/embeddings")

### Tool Configuration

- `TAVILY_API_KEY`: API key for Tavily search
- `TOOL_MODULES`: Comma-separated list of modules containing tools

### LangSmith Configuration

- `LANGCHAIN_API_KEY`: API key for LangSmith
- `LANGCHAIN_PROJECT`: Project name for LangSmith (default: "launch-ai-generator")

### Security Configuration

- `RATE_LIMIT_REQUESTS`: Maximum requests per window (default: 10)
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds (default: 60)
- `API_KEYS`: Comma-separated list of valid API keys

## Development

### Adding New Tools

1. Create a new tool function:
   ```python
   from langchain.tools import tool
   from pydantic import BaseModel, Field

   class MyToolInput(BaseModel):
       param1: str = Field(..., description="Description of param1")

   @tool("my_tool", args_schema=MyToolInput)
   def my_tool(param1: str) -> str:
       """
       Description of my tool.
       """
       # Tool implementation
       return f"Result: {param1}"
   \`\`\`

2. Register the tool in the tool registry:
   ```python
   from .tool_registry import ToolRegistry

   tool_registry = ToolRegistry()
   tool_registry.register_tool(my_tool)
   \`\`\`

### Adding Custom Memory

1. Create a custom memory class:
   ```python
   from langchain.memory import BaseMemory

   class MyCustomMemory(BaseMemory):
       # Custom memory implementation
       pass
   \`\`\`

2. Update the memory manager to use your custom memory:
   ```python
   from .memory_manager import MemoryManager

   memory_manager = MemoryManager()
   # Configure to use your custom memory
   \`\`\`

## Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents abuse through request rate limiting
- **Authentication**: Optional API key authentication for protected endpoints
- **Secure API Key Management**: Environment variables for sensitive credentials
- **Output Sanitization**: Prevents XSS and injection attacks

## Monitoring and Debugging

The system integrates with LangSmith for monitoring and debugging:

1. Set up a LangSmith account at https://smith.langchain.com/
2. Get your API key
3. Set the `LANGCHAIN_API_KEY` environment variable
4. Set the `LANGCHAIN_PROJECT` environment variable (optional)

This enables:
- Tracing of agent execution
- Visualization of tool usage
- Performance monitoring
- Error tracking

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

## Author

[Likhon Sheikh](https://github.com/likhonsheikhofficial)
\`\`\`

Let's create a critique document to evaluate the system:


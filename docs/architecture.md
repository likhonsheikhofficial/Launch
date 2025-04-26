/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

# Launch AI Generator - System Architecture

## Overview

Launch AI Generator is a production-ready system that integrates a LangChain-powered agent within a Flask server environment. The system is designed to be modular, scalable, and secure, with a focus on maintainability and extensibility.

## Architecture Components

### 1. Core Components

\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Flask Server   │────▶│  Agent Manager  │────▶│  LangChain Agent│
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Memory Manager │     │  Tool Registry  │     │  LLM Provider   │
│  (FAISS)        │     │                 │     │  (Together AI)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
\`\`\`

- **Flask Server**: Handles HTTP requests, WebSocket connections, and serves the web interface
- **Agent Manager**: Orchestrates agent creation, execution, and lifecycle management
- **LangChain Agent**: Implements the agent using LangChain Expression Language (LCEL)
- **Memory Manager**: Manages conversation history and vector-based memory using FAISS
- **Tool Registry**: Manages the tools available to the agent
- **LLM Provider**: Integrates with Together AI for language model capabilities

### 2. Data Flow

1. User sends a request to the Flask server via HTTP or WebSocket
2. Flask server validates the request and forwards it to the Agent Manager
3. Agent Manager creates or retrieves an agent instance with appropriate memory and tools
4. LangChain Agent processes the request using the LLM Provider
5. Agent uses tools from the Tool Registry as needed
6. Memory Manager stores conversation history and embeddings
7. Response is returned to the user via Flask server

### 3. Deployment Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                              │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │             │    │             │    │                 │  │
│  │ Serverless  │    │ Static      │    │ Environment     │  │
│  │ Functions   │    │ Assets      │    │ Variables       │  │
│  │             │    │             │    │                 │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────┐    ┌─────────────┐    ┌─────────────────┐
│                 │    │             │    │                 │
│  Together AI    │    │ LangSmith   │    │ External APIs   │
│                 │    │             │    │                 │
└─────────────────┘    └─────────────┘    └─────────────────┘
\`\`\`

- **Vercel**: Hosts the application using serverless functions and static assets
- **Together AI**: Provides LLM capabilities
- **LangSmith**: Monitors and traces agent execution
- **External APIs**: Additional services used by tools

## Design Considerations

### 1. Modularity and Extensibility

The system is designed with modularity in mind, allowing for easy extension and modification:

- **Component-Based Architecture**: Each major component is isolated with clear interfaces
- **Plugin System for Tools**: New tools can be added without modifying core code
- **Configurable LLM Providers**: Support for multiple LLM providers with a unified interface
- **Extensible Memory Systems**: Memory implementations can be swapped based on requirements

### 2. Scalability

The system is designed to scale horizontally and vertically:

- **Stateless Design**: Core components are stateless, allowing for horizontal scaling
- **Efficient Resource Usage**: Optimized memory management and caching
- **Asynchronous Processing**: Non-blocking I/O for improved throughput
- **Serverless Architecture**: Automatic scaling based on demand

### 3. Security

Security is a primary concern, with multiple layers of protection:

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents abuse through request rate limiting
- **Authentication**: Optional authentication for protected endpoints
- **Secure API Key Management**: Environment variables for sensitive credentials
- **Output Sanitization**: Prevents XSS and injection attacks

### 4. Monitoring and Observability

Comprehensive monitoring ensures system health and performance:

- **LangSmith Integration**: Traces agent execution and tool usage
- **Structured Logging**: Detailed logs with appropriate levels
- **Performance Metrics**: Tracking of response times and resource usage
- **Error Tracking**: Comprehensive error handling and reporting

## Technology Choices and Trade-offs

### 1. Flask vs. FastAPI

**Choice**: Flask with ASGI server (via Uvicorn)

**Trade-offs**:
- **Pros**: Mature ecosystem, simple to use, good documentation
- **Cons**: Less built-in async support compared to FastAPI

**Rationale**: Flask provides a balance of simplicity and flexibility, with a mature ecosystem and extensive documentation. While FastAPI offers better built-in async support, Flask with Uvicorn provides sufficient performance for our needs.

### 2. LangChain vs. Custom Implementation

**Choice**: LangChain with LCEL

**Trade-offs**:
- **Pros**: Rapid development, extensive features, active community
- **Cons**: Additional dependency, potential overhead

**Rationale**: LangChain provides a comprehensive framework for building agents, with support for various LLMs, tools, and memory systems. The development speed and feature set outweigh the additional dependency.

### 3. FAISS vs. Other Vector Stores

**Choice**: FAISS for vector storage

**Trade-offs**:
- **Pros**: High performance, mature library, good documentation
- **Cons**: Memory-intensive, requires careful configuration

**Rationale**: FAISS provides excellent performance for similarity search, which is critical for semantic memory. Its maturity and optimization make it suitable for production use.

### 4. Together AI vs. Other LLM Providers

**Choice**: Together AI as primary provider

**Trade-offs**:
- **Pros**: High-quality models, reasonable pricing, good API
- **Cons**: Vendor lock-in risk, potential availability issues

**Rationale**: Together AI provides high-quality models at reasonable prices, with a reliable API. The system is designed to support multiple providers to mitigate vendor lock-in risk.

### 5. Vercel vs. Other Hosting Options

**Choice**: Vercel for deployment

**Trade-offs**:
- **Pros**: Serverless architecture, easy deployment, good scaling
- **Cons**: Potential cold start issues, limited execution time

**Rationale**: Vercel provides a simple deployment process with good scaling capabilities. The serverless architecture aligns well with the system's design, though cold start issues need to be managed.

## Conclusion

The Launch AI Generator architecture is designed to be production-ready, scalable, and secure. The modular design allows for easy extension and modification, while the choice of technologies balances performance, development speed, and maintainability.
\`\`\`

Now, let's create the enhanced agent implementation with LCEL:

```python file="api/agent/agent_manager.py"
# @author likhonsheikh
"""
Agent Manager for Launch AI Generator.

This module provides the core functionality for managing LangChain agents,
including creation, execution, and lifecycle management.
"""

import logging
import os
import time
from typing import Dict, List, Any, Optional, Tuple, Union
import uuid

from langchain.agents import AgentExecutor
from langchain.agents.format_scratchpad import format_to_openai_function_messages
from langchain.agents.output_parsers import OpenAIFunctionsAgentOutputParser
from langchain.callbacks.base import BaseCallbackHandler
from langchain.callbacks.tracers.langsmith import LangSmithTracer
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from langchain.schema.runnable import RunnablePassthrough, RunnableLambda
from langchain_core.messages import AIMessage, HumanMessage
from langchain_together import Together

from .memory_manager import MemoryManager
from .tool_registry import ToolRegistry
from .security import sanitize_input, sanitize_output
from .config import AgentConfig, get_config

logger = logging.getLogger(__name__)

class AgentManager:
    """
    Manages the lifecycle of LangChain agents.
    
    This class is responsible for creating, executing, and managing agents,
    including memory management and tool selection.
    """
    
    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the AgentManager.
        
        Args:
            config: Optional configuration for the agent manager
        """
        self.config = config or get_config()
        self.memory_manager = MemoryManager(config=self.config)
        self.tool_registry = ToolRegistry(config=self.config)
        self.active_agents: Dict[str, AgentExecutor] = {}
        
        # Initialize LangSmith tracer if configured
        self.tracer = None
        if self.config.langsmith_api_key:
            os.environ["LANGCHAIN_API_KEY"] = self.config.langsmith_api_key
            os.environ["LANGCHAIN_PROJECT"] = self.config.langsmith_project or "launch-ai-generator"
            self.tracer = LangSmithTracer(
                project_name=self.config.langsmith_project or "launch-ai-generator"
            )
    
    def get_agent(self, session_id: Optional[str] = None) -> Tuple[str, AgentExecutor]:
        """
        Get or create an agent for the given session.
        
        Args:
            session_id: Optional session ID for retrieving an existing agent
            
        Returns:
            A tuple of (session_id, agent_executor)
        """
        # Generate a new session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Return existing agent if available
        if session_id in self.active_agents:
            return session_id, self.active_agents[session_id]
        
        # Create a new agent
        agent = self._create_agent(session_id)
        self.active_agents[session_id] = agent
        
        # Clean up old agents to prevent memory leaks
        self._cleanup_old_agents()
        
        return session_id, agent
    
    def _create_agent(self, session_id: str) -> AgentExecutor:
        """
        Create a new agent with the specified configuration.
        
        Args:
            session_id: Session ID for the agent
            
        Returns:
            An AgentExecutor instance
        """
        # Get memory for this session
        memory = self.memory_manager.get_memory(session_id)
        
        # Get tools for this agent
        tools = self.tool_registry.get_tools()
        
        # Initialize the LLM
        llm = Together(
            model=self.config.model_name,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            together_api_key=self.config.together_api_key,
        )
        
        # Create the prompt
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self.config.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create the agent using LCEL
        agent = (
            {
                "input": lambda x: sanitize_input(x["input"]),
                "chat_history": lambda x: memory.load_memory_variables({})["chat_history"],
                "agent_scratchpad": lambda x: format_to_openai_function_messages(x["intermediate_steps"]),
            }
            | prompt
            | llm.bind_tools(tools)
            | OpenAIFunctionsAgentOutputParser()
        )
        
        # Create the agent executor
        callbacks = []
        if self.tracer:
            callbacks.append(self.tracer)
        
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=self.config.verbose,
            handle_parsing_errors=True,
            memory=memory,
            max_iterations=self.config.max_iterations,
            callbacks=callbacks,
        )
        
        return agent_executor
    
    def _cleanup_old_agents(self):
        """
        Clean up old agents to prevent memory leaks.
        """
        # If we have too many active agents, remove the oldest ones
        if len(self.active_agents) > self.config.max_active_agents:
            # Sort by creation time and remove oldest
            oldest_agents = sorted(self.active_agents.keys())[:len(self.active_agents) - self.config.max_active_agents]
            for agent_id in oldest_agents:
                del self.active_agents[agent_id]
                logger.info(f"Cleaned up agent {agent_id}")
    
    async def execute_agent(
        self, 
        input_text: str, 
        session_id: Optional[str] = None,
        streaming_callback: Optional[callable] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute an agent with the given input.
        
        Args:
            input_text: The input text to process
            session_id: Optional session ID for retrieving an existing agent
            streaming_callback: Optional callback for streaming responses
            
        Returns:
            A tuple of (session_id, response)
        """
        # Sanitize input
        input_text = sanitize_input(input_text)
        
        # Get or create an agent
        session_id, agent = self.get_agent(session_id)
        
        # Execute the agent
        try:
            # Create callbacks for streaming if needed
            callbacks = []
            if streaming_callback and self.config.enable_streaming:
                streaming_handler = StreamingCallbackHandler(streaming_callback)
                callbacks.append(streaming_handler)
            
            if self.tracer:
                callbacks.append(self.tracer)
            
            # Execute the agent
            if callbacks:
                response = await agent.ainvoke(
                    {"input": input_text},
                    config={"callbacks": callbacks}
                )
            else:
                response = await agent.ainvoke({"input": input_text})
            
            # Process the response
            processed_response = self._process_response(response)
            
            return session_id, processed_response
        except Exception as e:
            logger.exception(f"Error executing agent: {str(e)}")
            return session_id, {
                "output": f"Error: {str(e)}",
                "error": True,
                "tool_usage": []
            }
    
    def _process_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the agent's response to extract relevant information.
        
        Args:
            response: The raw response from the agent
            
        Returns:
            A processed response with extracted information
        """
        # Extract the output text
        output = response.get("output", "")
        
        # Sanitize output
        output = sanitize_output(output)
        
        # Extract tool usage information
        tool_usage = []
        for step in response.get("intermediate_steps", []):
            tool_name = step[0].tool
            tool_input = step[0].tool_input
            tool_output = step[1]
            
            tool_usage.append({
                "tool": tool_name,
                "input": tool_input,
                "output": tool_output
            })
        
        # Return the processed response
        return {
            "output": output,
            "tool_usage": tool_usage,
            "raw_response": response
        }


class StreamingCallbackHandler(BaseCallbackHandler):
    """
    Callback handler for streaming responses.
    """
    
    def __init__(self, callback: callable):
        """
        Initialize the streaming callback handler.
        
        Args:
            callback: Function to call with streaming chunks
        """
        self.callback = callback
    
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """
        Called when a new token is generated.
        
        Args:
            token: The generated token
            **kwargs: Additional arguments
        """
        self.callback(token)

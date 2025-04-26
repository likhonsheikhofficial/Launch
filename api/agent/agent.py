# @author likhonsheikh
"""
Core agent implementation using LangChain.
This module provides the main agent functionality, including creation and execution.
"""

import logging
import os
from typing import Dict, List, Any, Optional, Tuple

from langchain.agents import AgentExecutor
from langchain.agents.format_scratchpad import format_to_openai_function_messages
from langchain.agents.output_parsers import OpenAIFunctionsAgentOutputParser
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage
from langchain.schema.runnable import RunnablePassthrough, RunnableLambda
from langchain_core.messages import AIMessage, HumanMessage
from langchain_groq import ChatGroq

from .memory import get_memory
from .tools import get_tools

logger = logging.getLogger(__name__)

# System prompt for the agent
SYSTEM_PROMPT = """You are Launch, an AI-powered development assistant that helps users build applications.
You have access to various tools that can help you assist users with their development needs.
Always think step-by-step about the user's request before responding.

When generating code:
1. Focus on clean, maintainable, and production-ready code
2. Consider edge cases and error handling
3. Follow best practices for the language/framework being used
4. Provide clear comments and documentation

If you don't know something or can't complete a task with the tools available, be honest about your limitations.
Always cite your sources when providing information from search results.
"""

def create_agent(
    model_name: str = "llama3-70b-8192",
    temperature: float = 0.7,
    thread_id: Optional[str] = None,
) -> AgentExecutor:
    """
    Create a LangChain agent with the specified configuration.
    
    Args:
        model_name: The name of the Groq model to use
        temperature: The temperature for the model
        thread_id: Optional thread ID for conversation memory
        
    Returns:
        An AgentExecutor instance configured with the specified parameters
    """
    # Initialize the LLM
    llm = ChatGroq(
        api_key=os.environ.get("GROQ_API_KEY"),
        model_name=model_name,
        temperature=temperature,
    )
    
    # Get tools
    tools = get_tools()
    
    # Get memory
    memory = get_memory(thread_id)
    
    # Create the prompt
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # Create the agent
    agent = (
        {
            "input": RunnablePassthrough(),
            "chat_history": lambda x: memory.load_memory_variables({})["chat_history"],
            "agent_scratchpad": lambda x: format_to_openai_function_messages(x["intermediate_steps"]),
        }
        | prompt
        | llm.bind_functions(tools)
        | OpenAIFunctionsAgentOutputParser()
    )
    
    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        memory=memory,
        max_iterations=5,
    )
    
    return agent_executor

def process_agent_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process the agent's response to extract relevant information.
    
    Args:
        response: The raw response from the agent
        
    Returns:
        A processed response with extracted information
    """
    # Extract the output text
    output = response.get("output", "")
    
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

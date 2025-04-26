# @author likhonsheikh
"""
Tool Registry for Launch AI Generator.

This module provides a registry for tools that can be used by the agent.
"""

import logging
import inspect
import importlib
import os
import sys
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
import httpx
import json

from langchain.tools import BaseTool, StructuredTool, tool
from langchain.pydantic_v1 import BaseModel, Field, create_model
from langchain.callbacks.manager import CallbackManagerForToolRun

from .config import AgentConfig, get_config

logger = logging.getLogger(__name__)

class ToolRegistry:
    """
    Registry for tools that can be used by the agent.
    """
    
    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the tool registry.
        
        Args:
            config: Optional configuration for the tool registry
        """
        self.config = config or get_config()
        self.tools: Dict[str, BaseTool] = {}
        self.tool_modules: List[str] = []
        
        # Register built-in tools
        self._register_builtin_tools()
        
        # Register custom tools from modules
        if self.config.tool_modules:
            for module_name in self.config.tool_modules:
                self.register_tools_from_module(module_name)
    
    def _register_builtin_tools(self):
        """
        Register built-in tools.
        """
        # Register search tool if API key is available
        if self.config.tavily_api_key:
            self.register_tool(search_tool)
        
        # Register code generation tool
        self.register_tool(generate_code_tool)
        
        # Register web browsing tool
        self.register_tool(browse_website_tool)
    
    def register_tool(self, tool_func: Callable) -> bool:
        """
        Register a tool function.
        
        Args:
            tool_func: Function to register as a tool
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if function is already a tool
            if isinstance(tool_func, BaseTool):
                self.tools[tool_func.name] = tool_func
                logger.info(f"Registered tool: {tool_func.name}")
                return True
            
            # Convert function to tool
            tool_instance = tool(tool_func)
            self.tools[tool_instance.name] = tool_instance
            logger.info(f"Registered tool: {tool_instance.name}")
            return True
        except Exception as e:
            logger.error(f"Error registering tool {getattr(tool_func, '__name__', 'unknown')}: {str(e)}")
            return False
    
    def register_tools_from_module(self, module_name: str) -> int:
        """
        Register all tools from a module.
        
        Args:
            module_name: Name of the module to register tools from
            
        Returns:
            Number of tools registered
        """
        try:
            # Import the module
            module = importlib.import_module(module_name)
            self.tool_modules.append(module_name)
            
            # Find all tool functions in the module
            count = 0
            for name, obj in inspect.getmembers(module):
                # Register if it's a BaseTool instance
                if isinstance(obj, BaseTool):
                    self.tools[obj.name] = obj
                    count += 1
                    logger.info(f"Registered tool from module {module_name}: {obj.name}")
                
                # Register if it's a function with the @tool decorator
                elif callable(obj) and hasattr(obj, "_tool"):
                    tool_instance = obj._tool
                    self.tools[tool_instance.name] = tool_instance
                    count += 1
                    logger.info(f"Registered tool from module {module_name}: {tool_instance.name}")
            
            logger.info(f"Registered {count} tools from module {module_name}")
            return count
        except Exception as e:
            logger.error(f"Error registering tools from module {module_name}: {str(e)}")
            return 0
    
    def get_tools(self) -> List[BaseTool]:
        """
        Get all registered tools.
        
        Returns:
            List of registered tools
        """
        return list(self.tools.values())
    
    def get_tool(self, name: str) -> Optional[BaseTool]:
        """
        Get a specific tool by name.
        
        Args:
            name: Name of the tool to get
            
        Returns:
            The tool if found, None otherwise
        """
        return self.tools.get(name)


class SearchInput(BaseModel):
    """Input for the search tool."""
    query: str = Field(..., description="The search query")

@tool("search", args_schema=SearchInput)
async def search_tool(query: str) -> str:
    """
    Search the web for information on a given query.
    This tool uses the Tavily API to search the web.
    """
    config = get_config()
    tavily_api_key = config.tavily_api_key
    
    if not tavily_api_key:
        return "Search tool is not configured. Please set the TAVILY_API_KEY environment variable."
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                headers={"Content-Type": "application/json"},
                json={
                    "api_key": tavily_api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "include_domains": [],
                    "exclude_domains": [],
                    "max_results": 5
                }
            )
            
            if response.status_code != 200:
                return f"Error searching: {response.status_code} - {response.text}"
            
            results = response.json()
            formatted_results = []
            
            for result in results.get("results", []):
                formatted_results.append(f"Title: {result.get('title')}")
                formatted_results.append(f"URL: {result.get('url')}")
                formatted_results.append(f"Content: {result.get('content')}")
                formatted_results.append("---")
            
            return "\n".join(formatted_results)
    except Exception as e:
        logger.error(f"Error in search tool: {str(e)}")
        return f"Error searching: {str(e)}"

class CodeGenerationInput(BaseModel):
    """Input for the code generation tool."""
    description: str = Field(..., description="Description of the code to generate")
    language: str = Field(..., description="Programming language to use")
    framework: Optional[str] = Field(None, description="Framework to use (if applicable)")

@tool("generate_code", args_schema=CodeGenerationInput)
async def generate_code_tool(
    description: str,
    language: str,
    framework: Optional[str] = None
) -> str:
    """
    Generate code based on a description.
    This tool uses the Together AI API to generate code.
    """
    config = get_config()
    together_api_key = config.together_api_key
    
    if not together_api_key:
        return "Code generation tool is not configured. Please set the TOGETHER_API_KEY environment variable."
    
    try:
        # Construct the prompt
        framework_text = f" using the {framework} framework" if framework else ""
        prompt = f"Generate {language} code{framework_text} for: {description}\n\nProvide only the code with appropriate comments. Do not include any explanations outside of code comments."
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.together.xyz/v1/completions",
                headers={
                    "Authorization": f"Bearer {together_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "togethercomputer/llama-3-70b-instruct",
                    "prompt": prompt,
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            
            if response.status_code != 200:
                return f"Error generating code: {response.status_code} - {response.text}"
            
            result = response.json()
            code = result["choices"][0]["text"]
            return code
    except Exception as e:
        logger.error(f"Error in code generation tool: {str(e)}")
        return f"Error generating code: {str(e)}"

class BrowseWebsiteInput(BaseModel):
    """Input for the web browsing tool."""
    url: str = Field(..., description="URL of the website to browse")

@tool("browse_website", args_schema=BrowseWebsiteInput)
async def browse_website_tool(url: str) -> str:
    """
    Browse a website and extract its content.
    This tool fetches the content of a webpage and returns it as text.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                },
                follow_redirects=True
            )
            
            if response.status_code != 200:
                return f"Error browsing website: {response.status_code} - {response.text}"
            
            # Extract text content (simplified)
            content = response.text
            
            # Return a summary of the content
            return f"Successfully fetched content from {url}. Content length: {len(content)} characters."
    except Exception as e:
        logger.error(f"Error in browse website tool: {str(e)}")
        return f"Error browsing website: {str(e)}"

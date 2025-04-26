# @author likhonsheikh
"""
Tools implementation for the agent.
This module provides various tools that the agent can use to assist users.
"""

import logging
from typing import List, Dict, Any, Optional
import json
import httpx
import os
from langchain.tools import BaseTool, StructuredTool, tool
from langchain.callbacks.manager import CallbackManagerForToolRun
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class SearchInput(BaseModel):
    """Input for the search tool."""
    query: str = Field(..., description="The search query")

@tool("search", args_schema=SearchInput)
async def search_tool(query: str) -> str:
    """
    Search the web for information on a given query.
    This tool uses the Tavily API to search the web.
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")
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
    This tool uses the Groq API to generate code.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return "Code generation tool is not configured. Please set the GROQ_API_KEY environment variable."
    
    try:
        # Construct the prompt
        framework_text = f" using the {framework} framework" if framework else ""
        prompt = f"Generate {language} code{framework_text} for: {description}\n\nProvide only the code with appropriate comments. Do not include any explanations outside of code comments."
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-70b-8192",
                    "messages": [
                        {"role": "system", "content": "You are a code generation assistant. Provide clean, well-commented, production-ready code."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            
            if response.status_code != 200:
                return f"Error generating code: {response.status_code} - {response.text}"
            
            result = response.json()
            code = result["choices"][0]["message"]["content"]
            return code
    except Exception as e:
        logger.error(f"Error in code generation tool: {str(e)}")
        return f"Error generating code: {str(e)}"

def get_tools() -> List[BaseTool]:
    """
    Get the list of tools available to the agent.
    
    Returns:
        A list of BaseTool instances
    """
    return [
        search_tool,
        generate_code_tool,
    ]

# @author likhonsheikh
"""
Configuration module for Launch AI Generator.

This module provides configuration functionality for the agent,
including loading configuration from environment variables and files.
"""

import logging
import os
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class AgentConfig:
    """
    Configuration for the agent.
    """
    # LLM configuration
    together_api_key: str = ""
    model_name: str = "togethercomputer/llama-3-70b-instruct"
    temperature: float = 0.7
    max_tokens: int = 2000
    
    # Agent configuration
    system_prompt: str = ""
    max_iterations: int = 5
    verbose: bool = False
    max_active_agents: int = 100
    enable_streaming: bool = True
    
    # Memory configuration
    use_vector_memory: bool = True
    memory_dir: str = "/tmp/launch/memory"
    memory_k: int = 5
    embeddings_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings_cache_dir: str = "/tmp/launch/embeddings"
    
    # Tool configuration
    tavily_api_key: str = ""
    tool_modules: List[str] = field(default_factory=list)
    
    # LangSmith configuration
    langsmith_api_key: str = ""
    langsmith_project: str = "launch-ai-generator"
    
    # Security configuration
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    api_keys: List[str] = field(default_factory=list)

def load_config_from_env() -> AgentConfig:
    """
    Load configuration from environment variables.
    
    Returns:
        An AgentConfig instance
    """
    config = AgentConfig()
    
    # LLM configuration
    config.together_api_key = os.getenv("TOGETHER_API_KEY", "")
    config.model_name = os.getenv("TOGETHER_MODEL", "togethercomputer/llama-3-70b-instruct")
    config.temperature = float(os.getenv("TOGETHER_TEMPERATURE", "0.7"))
    config.max_tokens = int(os.getenv("TOGETHER_MAX_TOKENS", "2000"))
    
    # Agent configuration
    prompt_path = os.getenv("AGENT_PROMPT_PATH", "prompts/agent_prompt.txt")
    if os.path.exists(prompt_path):
        with open(prompt_path, "r") as f:
            config.system_prompt = f.read()
    else:
        logger.warning(f"Prompt file not found: {prompt_path}")
        config.system_prompt = os.getenv("AGENT_PROMPT", "You are a helpful AI assistant.")
    
    config.max_iterations = int(os.getenv("AGENT_MAX_ITERATIONS", "5"))
    config.verbose = os.getenv("AGENT_VERBOSE", "false").lower() == "true"
    config.max_active_agents = int(os.getenv("AGENT_MAX_ACTIVE", "100"))
    config.enable_streaming = os.getenv("AGENT_ENABLE_STREAMING", "true").lower() == "true"
    
    # Memory configuration
    config.use_vector_memory = os.getenv("MEMORY_USE_VECTOR", "true").lower() == "true"
    config.memory_dir = os.getenv("MEMORY_DIR", "/tmp/launch/memory")
    config.memory_k = int(os.getenv("MEMORY_K", "5"))
    config.embeddings_model = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    config.embeddings_cache_dir = os.getenv("EMBEDDINGS_CACHE_DIR", "/tmp/launch/embeddings")
    
    # Tool configuration
    config.tavily_api_key = os.getenv("TAVILY_API_KEY", "")
    tool_modules_str = os.getenv("TOOL_MODULES", "")
    if tool_modules_str:
        config.tool_modules = tool_modules_str.split(",")
    
    # LangSmith configuration
    config.langsmith_api_key = os.getenv("LANGCHAIN_API_KEY", "")
    config.langsmith_project = os.getenv("LANGCHAIN_PROJECT", "launch-ai-generator")
    
    # Security configuration
    config.rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
    config.rate_limit_window = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    api_keys_str = os.getenv("API_KEYS", "")
    if api_keys_str:
        config.api_keys = api_keys_str.split(",")
    
    return config

_config: Optional[AgentConfig] = None

def get_config() -> AgentConfig:
    """
    Get the configuration.
    
    Returns:
        An AgentConfig instance
    """
    global _config
    if _config is None:
        _config = load_config_from_env()
    return _config

def set_config(config: AgentConfig) -> None:
    """
    Set the configuration.
    
    Args:
        config: Configuration to set
    """
    global _config
    _config = config

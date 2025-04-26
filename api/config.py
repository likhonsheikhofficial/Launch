# @author likhonsheikh
"""
Configuration module for Launch AI Generator.

This module provides configuration functionality for the application,
including loading configuration from environment variables.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

@dataclass
class AppConfig:
    """
    Configuration for the application.
    """
    # LLM configuration
    groq_api_key: str = ""
    together_api_key: str = ""
    model_name: str = "llama3-70b-8192"  # Default to Groq's Llama 3 model
    provider: str = "groq"  # Default provider: "groq" or "together"
    temperature: float = 0.7
    max_tokens: int = 2000
    
    # LangSmith configuration
    langsmith_api_key: str = ""
    langsmith_project: str = "launch-ai-generator"
    langsmith_endpoint: str = "https://api.smith.langchain.com"
    tracing_enabled: bool = True
    
    # Application configuration
    debug: bool = False
    port: int = 8000
    host: str = "0.0.0.0"
    
    # Security configuration
    api_keys: List[str] = field(default_factory=list)
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    cors_origins: List[str] = field(default_factory=list)
    
    # Evaluation configuration
    run_evaluations: bool = True
    evaluation_dataset: str = "launch-generator-evals"
    
    # Caching configuration
    enable_caching: bool = True
    cache_ttl: int = 3600  # 1 hour

def load_config() -> AppConfig:
    """
    Load configuration from environment variables.
    
    Returns:
        An AppConfig instance
    """
    config = AppConfig()
    
    # LLM configuration
    config.groq_api_key = os.getenv("GROQ_API_KEY", "")
    config.together_api_key = os.getenv("TOGETHER_API_KEY", "")
    
    # Set provider based on available API keys
    if config.groq_api_key:
        config.provider = "groq"
    elif config.together_api_key:
        config.provider = "together"
    else:
        logger.warning("No LLM API keys found. Please set GROQ_API_KEY or TOGETHER_API_KEY.")
    
    # Set model based on provider
    provider = os.getenv("LLM_PROVIDER", config.provider).lower()
    if provider == "groq":
        config.provider = "groq"
        config.model_name = os.getenv("GROQ_MODEL", "llama3-70b-8192")
    elif provider == "together":
        config.provider = "together"
        config.model_name = os.getenv("TOGETHER_MODEL", "togethercomputer/llama-3-70b-instruct")
    
    config.temperature = float(os.getenv("TEMPERATURE", "0.7"))
    config.max_tokens = int(os.getenv("MAX_TOKENS", "2000"))
    
    # LangSmith configuration
    config.langsmith_api_key = os.getenv("LANGSMITH_API_KEY", "")
    config.langsmith_project = os.getenv("LANGSMITH_PROJECT", "launch-ai-generator")
    config.langsmith_endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    config.tracing_enabled = os.getenv("TRACING_ENABLED", "true").lower() == "true"
    
    # Application configuration
    config.debug = os.getenv("DEBUG", "false").lower() == "true"
    config.port = int(os.getenv("PORT", "8000"))
    config.host = os.getenv("HOST", "0.0.0.0")
    
    # Security configuration
    api_keys_str = os.getenv("API_KEYS", "")
    if api_keys_str:
        config.api_keys = api_keys_str.split(",")
    config.rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
    config.rate_limit_window = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # CORS configuration
    cors_origins_str = os.getenv("CORS_ORIGINS", "")
    if cors_origins_str:
        config.cors_origins = cors_origins_str.split(",")
    
    # Evaluation configuration
    config.run_evaluations = os.getenv("RUN_EVALUATIONS", "true").lower() == "true"
    config.evaluation_dataset = os.getenv("EVALUATION_DATASET", "launch-generator-evals")
    
    # Caching configuration
    config.enable_caching = os.getenv("ENABLE_CACHING", "true").lower() == "true"
    config.cache_ttl = int(os.getenv("CACHE_TTL", "3600"))
    
    # Set up LangSmith environment variables
    if config.langsmith_api_key:
        os.environ["LANGCHAIN_API_KEY"] = config.langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = config.langsmith_project
        os.environ["LANGCHAIN_ENDPOINT"] = config.langsmith_endpoint
        os.environ["LANGCHAIN_TRACING_V2"] = "true" if config.tracing_enabled else "false"
    
    return config

# Global configuration instance
config = load_config()

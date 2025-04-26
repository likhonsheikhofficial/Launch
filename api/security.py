# @author likhonsheikh
"""
Security module for Launch AI Generator.

This module provides security-related functionality, including input validation,
output sanitization, and API key validation.
"""

import logging
import re
import html
from typing import Dict, Any, Optional
from flask import Request

from .config import config

logger = logging.getLogger(__name__)

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks.
    
    Args:
        text: Input text to sanitize
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove potentially dangerous patterns
    # Remove HTML/XML tags
    text = re.sub(r'<[^>]*>', '', text)
    
    # Remove potential SQL injection patterns
    text = re.sub(r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|CREATE|WHERE)\b)', 
                 lambda match: match.group(1).lower(), text, flags=re.IGNORECASE)
    
    # Remove potential command injection patterns
    text = re.sub(r'(;|\||\$\(|\`)', ' ', text)
    
    # Limit length
    max_length = 4000
    if len(text) > max_length:
        text = text[:max_length]
        logger.warning(f"Input text truncated to {max_length} characters")
    
    return text

def sanitize_output(text: str) -> str:
    """
    Sanitize output to prevent XSS and other attacks.
    
    Args:
        text: Output text to sanitize
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Escape HTML entities
    text = html.escape(text)
    
    return text

def validate_api_key(request: Request) -> bool:
    """
    Validate API key from request headers.
    
    Args:
        request: Flask request object
        
    Returns:
        True if valid, False otherwise
    """
    if not config.api_keys:
        return True
    
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        return False
    
    return api_key in config.api_keys

def validate_request_origin(request: Request) -> bool:
    """
    Validate request origin to prevent CSRF attacks.
    
    Args:
        request: Flask request object
        
    Returns:
        True if valid, False otherwise
    """
    # Allow all origins in development
    if config.debug:
        return True
    
    # Check origin header
    origin = request.headers.get("Origin")
    if not origin:
        return True  # No origin header, could be a direct API call
    
    # List of allowed origins
    allowed_origins = [
        "https://launch-ai-generator.vercel.app",
        "https://launch-ai.vercel.app",
        # Add more as needed
    ]
    
    return origin in allowed_origins

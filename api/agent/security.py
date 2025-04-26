# @author likhonsheikh
"""
Security module for Launch AI Generator.

This module provides security-related functionality, including input validation,
output sanitization, and rate limiting.
"""

import logging
import re
import time
from typing import Dict, Any, Optional
import html
import hashlib

logger = logging.getLogger(__name__)

# Rate limiting storage
rate_limits: Dict[str, Dict[str, Any]] = {}

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

def check_rate_limit(client_id: str, limit: int = 10, window: int = 60) -> bool:
    """
    Check if a client has exceeded the rate limit.
    
    Args:
        client_id: Identifier for the client
        limit: Maximum number of requests allowed in the window
        window: Time window in seconds
        
    Returns:
        True if rate limit is not exceeded, False otherwise
    """
    current_time = time.time()
    
    # Initialize rate limit entry if not exists
    if client_id not in rate_limits:
        rate_limits[client_id] = {
            "count": 0,
            "reset_time": current_time + window
        }
    
    # Reset count if window has passed
    if current_time > rate_limits[client_id]["reset_time"]:
        rate_limits[client_id] = {
            "count": 0,
            "reset_time": current_time + window
        }
    
    # Check if limit is exceeded
    if rate_limits[client_id]["count"] >= limit:
        logger.warning(f"Rate limit exceeded for client {client_id}")
        return False
    
    # Increment count
    rate_limits[client_id]["count"] += 1
    
    return True

def generate_client_id(ip_address: str, user_agent: str) -> str:
    """
    Generate a client ID from IP address and user agent.
    
    Args:
        ip_address: Client IP address
        user_agent: Client user agent
        
    Returns:
        A hashed client ID
    """
    # Combine IP and user agent
    client_string = f"{ip_address}|{user_agent}"
    
    # Hash the string
    client_hash = hashlib.sha256(client_string.encode()).hexdigest()
    
    return client_hash

def validate_api_key(api_key: str, valid_keys: list) -> bool:
    """
    Validate an API key.
    
    Args:
        api_key: API key to validate
        valid_keys: List of valid API keys
        
    Returns:
        True if valid, False otherwise
    """
    if not api_key:
        return False
    
    return api_key in valid_keys

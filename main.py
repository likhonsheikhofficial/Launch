# @author likhonsheikh
"""
Main entry point for the Launch AI Generator application.
"""

import os
import logging
from api.app import app
from api.config import config

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log configuration immediately (on cold start)
logger.info(f"Starting Launch AI Generator with provider: {config.provider}")
logger.info(f"Model: {config.model_name}")
logger.info(f"LangSmith tracing enabled: {config.tracing_enabled}")
logger.info(f"Rate limiting: {config.rate_limit_requests} requests per {config.rate_limit_window} seconds")

# --- DO NOT call app.run() ---
# Simply expose the `app` object
# Vercel will automatically find and serve it

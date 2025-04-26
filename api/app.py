# @author likhonsheikh
"""
Main application module for Launch AI Generator.

This module provides the Flask application and routes for the web interface.
"""

import logging
import os
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime

from flask import Flask, Response, render_template, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

from .routes.mdx_routes import init_app as init_mdx_routes
from .security import check_rate_limit

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Add proxy support for proper IP detection
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Register routes
init_mdx_routes(app)

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors"""
    return jsonify(error="Rate limit exceeded", message=str(e.description)), 429

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify(error="Internal server error", message=str(e)), 500

@app.errorhandler(404)
def not_found_error(e):
    """Handle not found errors"""
    return jsonify(error="Not found", message=str(e)), 404

@app.route('/health')
@check_rate_limit
def health_check():
    """Health check endpoint"""
    return jsonify(status="ok", service="mdx-processor")

if __name__ == '__main__':
    app.run(debug=True)

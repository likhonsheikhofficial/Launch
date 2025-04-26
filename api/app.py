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

from flask import Flask, request, jsonify, render_template, Response, stream_with_context
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from langsmith import Client as LangSmithClient

from .config import config
from .prompt_engineering import PromptEngineer
from .security import sanitize_input, validate_api_key

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
CORS(app)

# Initialize rate limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

# Initialize prompt engineer
prompt_engineer = PromptEngineer()

# Initialize LangSmith client if API key is available
langsmith_client = None
if config.langsmith_api_key:
    langsmith_client = LangSmithClient(api_key=config.langsmith_api_key)

# Create tmp directory for versions
os.makedirs("/tmp/launch/versions", exist_ok=True)

@app.route("/", methods=["GET"])
def index():
    """Render the main application page."""
    return render_template("index.html")

@app.route("/api/generate", methods=["POST"])
@limiter.limit("10 per minute")  # Stricter limit for LLM generation
async def generate():
    """Generate code based on user prompt."""
    try:
        # Validate API key if configured
        if config.api_keys and not validate_api_key(request):
            return jsonify({"error": "Invalid API key"}), 401
            
        data = request.json or {}
        prompt = sanitize_input(data.get("prompt", ""))
        prompt_type = sanitize_input(data.get("prompt_type", "default"))
        additional_context = sanitize_input(data.get("additional_context", ""))
        
        if not prompt:
            return jsonify({"error": "Missing prompt"}), 400
        
        logger.info(f"Received generate request with prompt: {prompt[:50]}...")
        
        # Generate code
        result = await prompt_engineer.generate_code(
            user_input=prompt,
            prompt_type=prompt_type,
            additional_context=additional_context
        )
        
        # Save version
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        version_info = {
            "timestamp": timestamp,
            "tag": f"v{timestamp}",
            "prompt": prompt[:100] + ("..." if len(prompt) > 100 else ""),
            "prompt_type": prompt_type,
            "model": config.model_name,
            "date": datetime.utcnow().isoformat(),
            "run_id": result.get("run_id")
        }
        
        version_file = f"/tmp/launch/versions/{timestamp}.json"
        with open(version_file, "w") as f:
            json.dump(version_info, f)
        
        code_file = f"/tmp/launch/versions/{timestamp}.html"
        with open(code_file, "w") as f:
            f.write(result["generated_code"])
        
        return jsonify({
            "generated": result["generated_code"],
            "timestamp": timestamp,
            "version": version_info,
            "run_id": result.get("run_id")
        })
    
    except Exception as e:
        logger.exception(f"Error in generate endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/stream-generate", methods=["POST"])
@limiter.limit("10 per minute")  # Stricter limit for LLM generation
async def stream_generate():
    """Stream code generation based on user prompt."""
    try:
        # Validate API key if configured
        if config.api_keys and not validate_api_key(request):
            return jsonify({"error": "Invalid API key"}), 401
            
        data = request.json or {}
        prompt = sanitize_input(data.get("prompt", ""))
        prompt_type = sanitize_input(data.get("prompt_type", "default"))
        additional_context = sanitize_input(data.get("additional_context", ""))
        
        if not prompt:
            return jsonify({"error": "Missing prompt"}), 400
        
        logger.info(f"Received stream generate request with prompt: {prompt[:50]}...")
        
        async def generate_stream():
            # Start with a response header
            yield "data: {\"type\": \"start\", \"message\": \"Generation started\"}\n\n"
            
            # Stream the generation
            async for chunk in prompt_engineer.stream_code_generation(
                user_input=prompt,
                prompt_type=prompt_type,
                additional_context=additional_context
            ):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            
            # End with completion message
            yield "data: {\"type\": \"end\", \"message\": \"Generation complete\"}\n\n"
        
        return Response(
            stream_with_context(generate_stream()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        logger.exception(f"Error in stream generate endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/versions", methods=["GET"])
@limiter.limit("60 per minute")  # Higher limit for read operations
def versions():
    """Get all saved versions."""
    try:
        versions_list = []
        versions_dir = "/tmp/launch/versions"
        
        if os.path.exists(versions_dir):
            for filename in os.listdir(versions_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(versions_dir, filename), "r") as f:
                        version_info = json.load(f)
                        versions_list.append(version_info)
        
        return jsonify({"versions": sorted(versions_list, key=lambda x: x["timestamp"], reverse=True)})
    
    except Exception as e:
        logger.exception(f"Error getting versions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/version/<timestamp>", methods=["GET"])
@limiter.limit("60 per minute")  # Higher limit for read operations
def get_version(timestamp):
    """Get a specific version."""
    try:
        # Sanitize input
        timestamp = sanitize_input(timestamp)
        
        version_file = f"/tmp/launch/versions/{timestamp}.json"
        code_file = f"/tmp/launch/versions/{timestamp}.html"
        
        if not os.path.exists(version_file) or not os.path.exists(code_file):
            return jsonify({"error": "Version not found"}), 404
        
        with open(version_file, "r") as f:
            version_info = json.load(f)
        
        with open(code_file, "r") as f:
            code = f.read()
        
        return jsonify({
            "version": version_info,
            "code": code
        })
    
    except Exception as e:
        logger.exception(f"Error getting version: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/evaluate", methods=["POST"])
@limiter.limit("5 per minute")  # Stricter limit for evaluations
async def evaluate_prompt():
    """Evaluate a prompt using LangSmith."""
    try:
        # Validate API key if configured
        if config.api_keys and not validate_api_key(request):
            return jsonify({"error": "Invalid API key"}), 401
            
        if not config.langsmith_api_key:
            return jsonify({"error": "LangSmith API key not configured"}), 400
        
        data = request.json or {}
        prompt_type = sanitize_input(data.get("prompt_type", "default"))
        dataset_name = sanitize_input(data.get("dataset_name"))
        criteria = data.get("criteria")
        
        if criteria:
            criteria = [sanitize_input(c) for c in criteria]
        
        # Run evaluation
        results = await prompt_engineer.evaluate_prompt(
            prompt_type=prompt_type,
            dataset_name=dataset_name,
            criteria=criteria
        )
        
        return jsonify(results)
    
    except Exception as e:
        logger.exception(f"Error in evaluate endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/dataset", methods=["POST"])
@limiter.limit("5 per minute")  # Stricter limit for dataset creation
async def create_dataset():
    """Create an evaluation dataset in LangSmith."""
    try:
        # Validate API key if configured
        if config.api_keys and not validate_api_key(request):
            return jsonify({"error": "Invalid API key"}), 401
            
        if not config.langsmith_api_key:
            return jsonify({"error": "LangSmith API key not configured"}), 400
        
        data = request.json or {}
        examples = data.get("examples", [])
        dataset_name = sanitize_input(data.get("dataset_name"))
        
        if not examples:
            return jsonify({"error": "No examples provided"}), 400
        
        # Sanitize examples
        sanitized_examples = []
        for example in examples:
            sanitized_example = {
                "input": sanitize_input(example.get("input", "")),
                "expected_output": sanitize_input(example.get("expected_output", ""))
            }
            sanitized_examples.append(sanitized_example)
        
        # Create dataset
        dataset_name = await prompt_engineer.create_evaluation_dataset(
            examples=sanitized_examples,
            dataset_name=dataset_name
        )
        
        if dataset_name:
            return jsonify({"dataset_name": dataset_name})
        else:
            return jsonify({"error": "Failed to create dataset"}), 500
    
    except Exception as e:
        logger.exception(f"Error in create_dataset endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/feedback", methods=["POST"])
@limiter.limit("20 per minute")
def submit_feedback():
    """Submit feedback for a run to LangSmith."""
    try:
        if not langsmith_client:
            return jsonify({"error": "LangSmith client not initialized"}), 400
        
        data = request.json or {}
        run_id = sanitize_input(data.get("run_id"))
        score = data.get("score")
        comment = sanitize_input(data.get("comment", ""))
        
        if not run_id or score is None:
            return jsonify({"error": "Missing run_id or score"}), 400
        
        # Submit feedback
        feedback = langsmith_client.create_feedback(
            run_id=run_id,
            key="user_rating",
            score=float(score),
            comment=comment
        )
        
        return jsonify({
            "feedback_id": feedback.id,
            "run_id": feedback.run_id,
            "key": feedback.key,
            "score": feedback.score,
            "comment": feedback.comment
        })
    
    except Exception as e:
        logger.exception(f"Error submitting feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
@limiter.exempt  # No rate limit on health checks
def health():
    """Health check endpoint."""
    status = {
        "status": "ok",
        "langsmith": bool(config.langsmith_api_key),
        "groq": bool(config.groq_api_key),
        "together": bool(config.together_api_key),
        "provider": config.provider,
        "model": config.model_name
    }
    
    return jsonify(status)

if __name__ == "__main__":
    app.run(host=config.host, port=config.port, debug=config.debug)

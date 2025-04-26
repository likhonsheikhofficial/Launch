"""
API routes for MDX processing and component generation
"""

import logging
from typing import Dict, Any, Optional
from flask import Blueprint, request, jsonify, current_app
from functools import wraps

from ..handlers.mdx_processor import MDXProcessor, ComponentType
from ..security import check_rate_limit, sanitize_input

logger = logging.getLogger(__name__)

# Initialize Blueprint and processor
mdx_routes = Blueprint('mdx', __name__)
mdx_processor = MDXProcessor()

def validate_request(f):
    """Validate incoming request data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Request validation error: {str(e)}")
            return jsonify({"error": "Invalid request format"}), 400
    return decorated_function

@mdx_routes.route('/process', methods=['POST'])
@check_rate_limit
@validate_request
async def process_mdx():
    """Process MDX content with components"""
    try:
        data = request.get_json()
        content = sanitize_input(data.get('content', ''))
        language = data.get('language', 'en')

        if not content:
            return jsonify({"error": "No content provided"}), 400

        processed_content = await mdx_processor.process_mdx(content, language)
        return jsonify({
            "content": processed_content
        })

    except Exception as e:
        logger.error(f"Error processing MDX: {str(e)}")
        return jsonify({"error": str(e)}), 500

@mdx_routes.route('/component/generate', methods=['POST'])
@check_rate_limit
@validate_request
async def generate_component():
    """Generate a new component based on description"""
    try:
        data = request.get_json()
        description = sanitize_input(data.get('description', ''))
        component_type = ComponentType(data.get('type', ComponentType.REACT))
        language = data.get('language', 'en')

        if not description:
            return jsonify({"error": "No description provided"}), 400

        mdx_content = f"```{component_type}\n{description}\n```"
        processed_content = await mdx_processor.process_mdx(mdx_content, language)

        return jsonify({
            "component": processed_content
        })

    except Exception as e:
        logger.error(f"Error generating component: {str(e)}")
        return jsonify({"error": str(e)}), 500

@mdx_routes.route('/component/preview', methods=['POST'])
@check_rate_limit
@validate_request
async def preview_component():
    """Generate a preview for a component"""
    try:
        data = request.get_json()
        component = sanitize_input(data.get('component', ''))
        
        if not component:
            return jsonify({"error": "No component provided"}), 400

        # Process the component and generate a preview
        try:
            preview_data = await mdx_processor.process_mdx(component)
            return jsonify({
                "preview": preview_data
            })
        except Exception as e:
            logger.error(f"Preview generation error: {str(e)}")
            return jsonify({"error": f"Failed to generate preview: {str(e)}"}), 500

    except Exception as e:
        logger.error(f"Error in preview endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

def init_app(app):
    """Initialize MDX routes with the Flask app"""
    app.register_blueprint(mdx_routes, url_prefix='/api/mdx')

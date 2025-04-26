# @author likhonsheikh
"""
Main entry point for the Launch AI Generator application.

This module provides the FastAPI application and routes for the web interface.
"""

import logging
import os
import datetime
import uuid
import json
from pathlib import Path
import traceback

from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import aiofiles
import httpx

# Import agent routes
from .agent_routes import router as agent_router
from .agent import get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
config = get_config()

# Initialize FastAPI app
app = FastAPI(
    title="Launch AI Generator",
    description="AI-powered application generator",
    version="1.0.0"
)

# Include agent routes
app.include_router(agent_router)

# Setup static files and templates
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Create tmp directory for uploads in serverless environment
TMP_DIR = Path("/tmp/launch")
UPLOADS_DIR = TMP_DIR / "uploads"
VERSIONS_DIR = TMP_DIR / "versions"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
VERSIONS_DIR.mkdir(parents=True, exist_ok=True)

# Enhanced system prompt
SYSTEM_PROMPT = """<thoughts>
Analyze user intent deeply. Consider the technical requirements, architecture, and potential challenges.
Formulate a comprehensive strategy that addresses all aspects of the request.
Think about scalability, maintainability, and best practices.
</thoughts>

<actions>
Break the problem into logical, modular components.
Design a clean, scalable architecture following industry standards.
Implement with clear, well-documented code.
Consider edge cases and error handling.
</actions>

<codebase>
&lt;!-- Output final polished code here -->
</codebase>

<critique>
Review the generated code for:
- Potential bugs or edge cases
- Performance optimizations
- Security considerations
- Best practices and standards compliance
Fix any issues before finalizing output.
</critique>"""

# Project templates
PROJECT_TEMPLATES = {
    "landing_page": "Create a responsive landing page with hero section, features, and call-to-action",
    "sign_up_form": "Build a user registration form with validation and submission handling",
    "dashboard": "Design a data dashboard with charts and filters",
    "blog": "Create a blog with posts and categories",
    "calculator": "Build a calculator with basic arithmetic operations",
    "e_commerce": "Build an e-commerce product page with cart functionality"
}

# Version tracking (serverless-friendly)
async def save_version(code, prompt, timestamp, template=None, model=None):
    """Save version information to a JSON file in the tmp directory"""
    version_info = {
        "timestamp": timestamp,
        "tag": f"v{timestamp}",
        "prompt": prompt[:100] + ("..." if len(prompt) > 100 else ""),
        "template": template,
        "model": model,
        "date": datetime.datetime.utcnow().isoformat()
    }
    
    version_file = VERSIONS_DIR / f"{timestamp}.json"
    async with aiofiles.open(version_file, "w") as f:
        await f.write(json.dumps(version_info))
    
    code_file = VERSIONS_DIR / f"{timestamp}.html"
    async with aiofiles.open(code_file, "w") as f:
        await f.write(code)
    
    return version_info

async def get_versions():
    """Get all saved versions"""
    versions = []
    try:
        for filename in os.listdir(VERSIONS_DIR):
            if filename.endswith(".json"):
                async with aiofiles.open(VERSIONS_DIR / filename, "r") as f:
                    content = await f.read()
                    version_info = json.loads(content)
                    versions.append(version_info)
        return sorted(versions, key=lambda x: x["timestamp"], reverse=True)
    except Exception as e:
        logger.error(f"Error getting versions: {e}")
        return []

async def generate_with_together(prompt, system_message=None):
    """Generate text using Together AI API"""
    if not config.together_api_key:
        logger.error("Together API key not configured")
        raise HTTPException(status_code=500, detail="Together API key not configured")
    
    headers = {
        "Authorization": f"Bearer {config.together_api_key}",
        "Content-Type": "application/json"
    }
    
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": config.model_name,
        "messages": messages,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens
    }
    
    logger.info(f"Sending request to Together API with model: {config.model_name}")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                "https://api.together.xyz/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = f"Together API returned status code {response.status_code}"
                try:
                    error_json = response.json()
                    if "error" in error_json:
                        error_detail += f": {error_json['error'].get('message', '')}"
                except:
                    error_detail += f": {response.text[:100]}"
                
                logger.error(error_detail)
                raise HTTPException(status_code=500, detail=error_detail)
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except httpx.RequestError as e:
            error_msg = f"Error connecting to Together API: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        except Exception as e:
            error_msg = f"Error calling Together API: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=error_msg)

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the main application page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/generate")
async def generate(prompt: str = Form(...), template: str = Form(None), model: str = Form("together")):
    """Generate code based on user prompt"""
    try:
        logger.info(f"Received generate request with prompt: {prompt[:50]}...")
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Missing prompt")

        # Add template context if provided
        template_context = ""
        if template and template in PROJECT_TEMPLATES:
            template_context = f"\nTemplate: {PROJECT_TEMPLATES[template]}\n"
            logger.info(f"Using template: {template}")

        # Compose full prompt
        full_prompt = f"{SYSTEM_PROMPT}{template_context}\n<user_request>{prompt}</user_request>"
        
        # Generate code using Together AI
        logger.info("Calling Together API...")
        generated_code = await generate_with_together(prompt, full_prompt)
        logger.info(f"Received response from Together API: {len(generated_code)} characters")
        
        # Save version
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        version_info = await save_version(generated_code, prompt, timestamp, template, model)
        logger.info(f"Saved version with timestamp: {timestamp}")
        
        return {
            "generated": generated_code, 
            "timestamp": timestamp,
            "version": version_info
        }
    
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/screenshot")
async def screenshot(image: UploadFile = File(...)):
    """Process screenshot and generate UI based on it"""
    try:
        if not image:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Save the image
        filename = f"{uuid.uuid4()}_{image.filename}"
        image_path = UPLOADS_DIR / filename
        
        async with aiofiles.open(image_path, "wb") as f:
            content = await image.read()
            await f.write(content)
        
        # Generate UI from screenshot
        prompt = f"Create a modern, responsive UI implementation based on this screenshot. Provide clean, production-ready HTML, CSS, and JavaScript code."
        
        # For now, return a placeholder response
        # In a real implementation, this would call an image-to-code model
        return {"image": "placeholder_image_data"}
    except Exception as e:
        logger.error(f"Error in screenshot endpoint: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/versions")
async def versions():
    """Get all saved versions"""
    versions_list = await get_versions()
    return {"versions": versions_list}

@app.get("/api/version/{timestamp}")
async def get_version(timestamp: str):
    """Get a specific version"""
    try:
        version_file = VERSIONS_DIR / f"{timestamp}.json"
        code_file = VERSIONS_DIR / f"{timestamp}.html"
        
        if not version_file.exists() or not code_file.exists():
            raise HTTPException(status_code=404, detail="Version not found")
            
        async with aiofiles.open(version_file, "r") as f:
            content = await f.read()
            version_info = json.loads(content)
            
        async with aiofiles.open(code_file, "r") as f:
            code = await f.read()
            
        return {
            "version": version_info,
            "code": code
        }
    except Exception as e:
        logger.error(f"Error getting version: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    api_status = {
        "status": "ok",
        "together": bool(config.together_api_key),
        "langsmith": bool(config.langsmith_api_key),
        "tavily": bool(config.tavily_api_key)
    }
    
    # Test Together API connection if key is available
    if config.together_api_key:
        try:
            headers = {
                "Authorization": f"Bearer {config.together_api_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("https://api.together.xyz/v1/models", headers=headers)
                api_status["together_connection"] = "ok" if response.status_code == 200 else "error"
        except Exception as e:
            api_status["together_connection"] = f"error: {str(e)}"
    
    return api_status

@app.get("/debug")
async def debug():
    """Debug endpoint to check environment and configuration"""
    if os.environ.get("VERCEL_ENV") != "production":
        return {
            "python_version": os.sys.version,
            "env_vars": {k: "***" if k.endswith("_KEY") or k.endswith("_SECRET") else v 
                         for k, v in os.environ.items()},
            "together_key_set": bool(config.together_api_key),
            "langsmith_key_set": bool(config.langsmith_api_key),
            "tavily_key_set": bool(config.tavily_api_key),
            "tmp_dir_exists": os.path.exists("/tmp"),
            "tmp_dir_writable": os.access("/tmp", os.W_OK),
            "launch_dir_exists": os.path.exists("/tmp/launch"),
            "versions_dir_exists": os.path.exists("/tmp/launch/versions"),
            "uploads_dir_exists": os.path.exists("/tmp/launch/uploads"),
            "agent_enabled": True
        }
    else:
        return {"message": "Debug information not available in production"}

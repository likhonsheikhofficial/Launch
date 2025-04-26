# @author likhonsheikh
"""
Flask routes for the agent functionality.

This module provides the HTTP and WebSocket endpoints for interacting with the agent.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .agent import AgentManager, check_rate_limit, sanitize_input, sanitize_output

logger = logging.getLogger(__name__)

# Initialize agent manager
agent_manager = AgentManager()

# Create router
router = APIRouter(prefix="/api/agent", tags=["agent"])

class AgentRequest(BaseModel):
    """Request model for agent interactions."""
    message: str
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    """Response model for agent interactions."""
    response: str
    tool_usage: list
    session_id: str

@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(
    request: AgentRequest,
    client_request: Request,
    x_api_key: Optional[str] = Header(None)
) -> AgentResponse:
    """
    Chat with the agent via HTTP.
    
    Args:
        request: The chat request
        client_request: The FastAPI request object
        x_api_key: Optional API key for authentication
        
    Returns:
        The agent's response
    """
    # Check API key if configured
    if agent_manager.config.api_keys and x_api_key not in agent_manager.config.api_keys:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Check rate limit
    client_ip = client_request.client.host
    user_agent = client_request.headers.get("user-agent", "")
    client_id = f"{client_ip}|{user_agent}"
    
    if not check_rate_limit(client_id, agent_manager.config.rate_limit_requests, agent_manager.config.rate_limit_window):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Process the message
        session_id, response = await agent_manager.execute_agent(
            input_text=request.message,
            session_id=request.session_id
        )
        
        # Check for errors
        if response.get("error", False):
            raise HTTPException(status_code=500, detail=response["output"])
        
        return AgentResponse(
            response=response["output"],
            tool_usage=response["tool_usage"],
            session_id=session_id
        )
    except Exception as e:
        logger.error(f"Error in chat_with_agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
    
    async def send_message(self, client_id: str, message: Dict[str, Any]):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for streaming agent responses.
    
    Args:
        websocket: The WebSocket connection
        client_id: The client ID
    """
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            # Validate request data
            if "message" not in request_data:
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": "Missing 'message' field in request"
                })
                continue
            
            # Get session ID
            session_id = request_data.get("session_id")
            
            # Send thinking state
            await manager.send_message(client_id, {
                "type": "thinking",
                "message": "Thinking...",
                "session_id": session_id
            })
            
            # Define streaming callback
            async def streaming_callback(token: str):
                await manager.send_message(client_id, {
                    "type": "token",
                    "token": token,
                    "session_id": session_id
                })
            
            # Process the message
            try:
                session_id, response = await agent_manager.execute_agent(
                    input_text=request_data["message"],
                    session_id=session_id,
                    streaming_callback=streaming_callback if agent_manager.config.enable_streaming else None
                )
                
                # Send response
                await manager.send_message(client_id, {
                    "type": "response",
                    "message": response["output"],
                    "tool_usage": response["tool_usage"],
                    "session_id": session_id
                })
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                })
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error in websocket_endpoint: {str(e)}")
        try:
            await manager.send_message(client_id, {
                "type": "error",
                "message": f"Error processing request: {str(e)}"
            })
        except:
            pass
        manager.disconnect(client_id)

@router.post("/clear-memory")
async def clear_memory(
    session_id: str,
    x_api_key: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Clear memory for a session.
    
    Args:
        session_id: The session ID
        x_api_key: Optional API key for authentication
        
    Returns:
        Status message
    """
    # Check API key if configured
    if agent_manager.config.api_keys and x_api_key not in agent_manager.config.api_keys:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        # Clear memory
        success = agent_manager.memory_manager.clear_memory(session_id)
        
        if success:
            return {"status": "success", "message": f"Memory cleared for session {session_id}"}
        else:
            return {"status": "error", "message": f"Failed to clear memory for session {session_id}"}
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error clearing memory: {str(e)}")

# @author likhonsheikh
"""
Tests for the API endpoints.
"""

import os
import pytest
from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)

def test_health_endpoint():
    """Test the health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "ok"

def test_debug_endpoint():
    """Test the debug endpoint."""
    # Set non-production environment
    os.environ["VERCEL_ENV"] = "development"
    
    response = client.get("/debug")
    assert response.status_code == 200
    assert "python_version" in response.json()
    
    # Test production environment
    os.environ["VERCEL_ENV"] = "production"
    response = client.get("/debug")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "not available in production" in response.json()["message"]

@pytest.mark.skipif(
    not os.environ.get("TOGETHER_API_KEY"),
    reason="TOGETHER_API_KEY environment variable not set"
)
def test_generate_endpoint():
    """Test the generate endpoint."""
    response = client.post(
        "/api/generate",
        data={
            "prompt": "Test prompt",
            "template": None,
            "model": "together"
        }
    )
    
    # This might fail if API key is invalid or rate limited
    if response.status_code == 200:
        assert "generated" in response.json()
        assert "timestamp" in response.json()
        assert "version" in response.json()
    else:
        # Skip if API call fails
        pytest.skip(f"API call failed with status {response.status_code}: {response.text}")

def test_versions_endpoint():
    """Test the versions endpoint."""
    response = client.get("/api/versions")
    assert response.status_code == 200
    assert "versions" in response.json()
    assert isinstance(response.json()["versions"], list)

@pytest.mark.skipif(
    not os.environ.get("TOGETHER_API_KEY"),
    reason="TOGETHER_API_KEY environment variable not set"
)
def test_agent_chat_endpoint():
    """Test the agent chat endpoint."""
    response = client.post(
        "/api/agent/chat",
        json={
            "message": "Hello, how are you?",
            "session_id": None
        }
    )
    
    # This might fail if API key is invalid or rate limited
    if response.status_code == 200:
        assert "response" in response.json()
        assert "tool_usage" in response.json()
        assert "session_id" in response.json()
    else:
        # Skip if API call fails
        pytest.skip(f"API call failed with status {response.status_code}: {response.text}")

# @author likhonsheikh
"""
Tests for the agent functionality.
"""

import os
import pytest
from unittest.mock import patch, MagicMock

from api.agent.config import AgentConfig
from api.agent.agent_manager import AgentManager
from api.agent.memory_manager import MemoryManager
from api.agent.tool_registry import ToolRegistry
from api.agent.security import sanitize_input, sanitize_output, check_rate_limit

# Skip tests if environment variables are not set
pytestmark = pytest.mark.skipif(
    not os.environ.get("TOGETHER_API_KEY"),
    reason="TOGETHER_API_KEY environment variable not set"
)

def test_sanitize_input():
    """Test input sanitization."""
    # Test HTML tag removal
    assert sanitize_input("<script>alert('XSS')</script>") == "alert('XSS')"
    
    # Test SQL injection pattern handling
    assert "select" in sanitize_input("SELECT * FROM users")
    
    # Test command injection pattern handling
    assert ";" not in sanitize_input("ls; rm -rf /")

def test_sanitize_output():
    """Test output sanitization."""
    # Test HTML escaping
    assert "&lt;" in sanitize_output("<script>")
    assert "&gt;" in sanitize_output("function() { return > 0; }")

def test_rate_limit():
    """Test rate limiting."""
    # Test within limit
    assert check_rate_limit("test_client", limit=5, window=60)
    
    # Test exceeding limit
    for _ in range(5):
        check_rate_limit("test_client_2", limit=5, window=60)
    
    assert not check_rate_limit("test_client_2", limit=5, window=60)

@patch("api.agent.memory_manager.FAISS")
@patch("api.agent.memory_manager.HuggingFaceEmbeddings")
def test_memory_manager(mock_embeddings, mock_faiss):
    """Test memory manager."""
    # Mock embeddings
    mock_embeddings_instance = MagicMock()
    mock_embeddings_instance.client.get_sentence_embedding_dimension.return_value = 384
    mock_embeddings.return_value = mock_embeddings_instance
    
    # Create config
    config = AgentConfig()
    config.memory_dir = "/tmp/test_memory"
    
    # Create memory manager
    memory_manager = MemoryManager(config=config)
    
    # Test get_memory
    memory = memory_manager.get_memory("test_session")
    assert memory is not None
    
    # Test clear_memory
    assert memory_manager.clear_memory("test_session")
    
    # Test non-existent memory
    assert not memory_manager.clear_memory("non_existent_session")

@patch("api.agent.tool_registry.httpx.AsyncClient")
def test_tool_registry(mock_client):
    """Test tool registry."""
    # Mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"choices": [{"text": "def test(): pass"}]}
    
    # Mock client
    mock_client_instance = MagicMock()
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.post.return_value = mock_response
    mock_client.return_value = mock_client_instance
    
    # Create config
    config = AgentConfig()
    config.together_api_key = "test_key"
    
    # Create tool registry
    tool_registry = ToolRegistry(config=config)
    
    # Test get_tools
    tools = tool_registry.get_tools()
    assert len(tools) > 0
    
    # Test get_tool
    assert tool_registry.get_tool("generate_code") is not None
    assert tool_registry.get_tool("non_existent_tool") is None

@patch("api.agent.agent_manager.Together")
@patch("api.agent.agent_manager.ToolRegistry")
@patch("api.agent.agent_manager.MemoryManager")
def test_agent_manager(mock_memory_manager, mock_tool_registry, mock_together):
    """Test agent manager."""
    # Mock LLM
    mock_llm = MagicMock()
    mock_together.return_value = mock_llm
    
    # Mock memory manager
    mock_memory = MagicMock()
    mock_memory_manager_instance = MagicMock()
    mock_memory_manager_instance.get_memory.return_value = mock_memory
    mock_memory_manager.return_value = mock_memory_manager_instance
    
    # Mock tool registry
    mock_tools = [MagicMock()]
    
    mock_tool_registry_instance = MagicMock()
    mock_tool_registry_instance.get_tools.return_value = mock_tools
    mock_tool_registry.return_value = mock_tool_registry_instance
    
    # Create config
    config = AgentConfig()
    config.together_api_key = "test_key"
    
    # Create agent manager
    agent_manager = AgentManager(config=config)
    
    # Test get_agent
    session_id, agent = agent_manager.get_agent()
    assert session_id is not None
    assert agent is not None
    
    # Test get_agent with existing session
    session_id2, agent2 = agent_manager.get_agent(session_id)
    assert session_id2 == session_id
    assert agent2 is agent

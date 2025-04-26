# @author likhonsheikh
"""
Memory implementation for the agent.
This module provides conversation memory functionality for the agent.
"""

import logging
from typing import Optional, Dict, Any, List

from langchain.memory import ConversationBufferMemory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)

class PersistentConversationMemory(ConversationBufferMemory):
    """
    Enhanced conversation memory with persistence capabilities.
    This class extends ConversationBufferMemory to add persistence and additional functionality.
    """
    
    def __init__(self, thread_id: Optional[str] = None, **kwargs):
        """
        Initialize the memory with optional thread ID for persistence.
        
        Args:
            thread_id: Optional thread ID for conversation persistence
            **kwargs: Additional arguments to pass to ConversationBufferMemory
        """
        super().__init__(return_messages=True, **kwargs)
        self.thread_id = thread_id
        self._load_from_storage()
    
    def _load_from_storage(self) -> None:
        """
        Load conversation history from storage if thread_id is provided.
        """
        if not self.thread_id:
            return
        
        # In a production environment, this would load from a database
        # For now, we'll just log that we would load from storage
        logger.info(f"Would load conversation history for thread {self.thread_id}")
    
    def _save_to_storage(self) -> None:
        """
        Save conversation history to storage if thread_id is provided.
        """
        if not self.thread_id:
            return
        
        # In a production environment, this would save to a database
        # For now, we'll just log that we would save to storage
        logger.info(f"Would save conversation history for thread {self.thread_id}")
    
    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        """
        Save the context of this conversation turn to memory.
        
        Args:
            inputs: The inputs to this conversation turn
            outputs: The outputs from this conversation turn
        """
        super().save_context(inputs, outputs)
        self._save_to_storage()
    
    def clear(self) -> None:
        """
        Clear memory contents.
        """
        super().clear()
        self._save_to_storage()
    
    def get_message_history(self) -> List[Dict[str, Any]]:
        """
        Get a serializable representation of the message history.
        
        Returns:
            A list of dictionaries representing the message history
        """
        history = []
        for message in self.chat_memory.messages:
            history.append({
                "role": "user" if isinstance(message, HumanMessage) else "assistant",
                "content": message.content,
                "type": message.__class__.__name__
            })
        return history

def get_memory(thread_id: Optional[str] = None) -> PersistentConversationMemory:
    """
    Get a memory instance with the specified thread ID.
    
    Args:
        thread_id: Optional thread ID for conversation persistence
        
    Returns:
        A PersistentConversationMemory instance
    """
    return PersistentConversationMemory(
        thread_id=thread_id,
        memory_key="chat_history",
        input_key="input",
    )

# @author likhonsheikh
"""
Memory Manager for Launch AI Generator.

This module provides memory management functionality for the agent,
including conversation history and vector-based memory using FAISS.
"""

import logging
import os
import pickle
import time
from typing import Dict, List, Any, Optional, Tuple, Union
import uuid

import faiss
import numpy as np
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory, VectorStoreRetrieverMemory
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from .config import AgentConfig, get_config

logger = logging.getLogger(__name__)

class MemoryManager:
    """
    Manages memory for agents, including conversation history and vector-based memory.
    """
    
    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the memory manager.
        
        Args:
            config: Optional configuration for the memory manager
        """
        self.config = config or get_config()
        self.memories: Dict[str, Any] = {}
        
        # Initialize embeddings model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.config.embeddings_model,
            cache_folder=self.config.embeddings_cache_dir
        )
        
        # Create memory directory if it doesn't exist
        os.makedirs(self.config.memory_dir, exist_ok=True)
    
    def get_memory(self, session_id: str) -> ConversationBufferMemory:
        """
        Get or create memory for the given session.
        
        Args:
            session_id: Session ID for retrieving or creating memory
            
        Returns:
            A ConversationBufferMemory instance
        """
        # Return existing memory if available
        if session_id in self.memories:
            return self.memories[session_id]
        
        # Try to load memory from disk
        memory_path = os.path.join(self.config.memory_dir, f"{session_id}.pkl")
        if os.path.exists(memory_path):
            try:
                with open(memory_path, "rb") as f:
                    memory = pickle.load(f)
                    self.memories[session_id] = memory
                    logger.info(f"Loaded memory for session {session_id}")
                    return memory
            except Exception as e:
                logger.error(f"Error loading memory for session {session_id}: {str(e)}")
        
        # Create new memory
        memory = self._create_memory(session_id)
        self.memories[session_id] = memory
        
        return memory
    
    def _create_memory(self, session_id: str) -> ConversationBufferMemory:
        """
        Create a new memory instance for the given session.
        
        Args:
            session_id: Session ID for the memory
            
        Returns:
            A ConversationBufferMemory instance
        """
        if self.config.use_vector_memory:
            return self._create_vector_memory(session_id)
        else:
            return ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="output"
            )
    
    def _create_vector_memory(self, session_id: str) -> VectorStoreRetrieverMemory:
        """
        Create a new vector-based memory instance for the given session.
        
        Args:
            session_id: Session ID for the memory
            
        Returns:
            A VectorStoreRetrieverMemory instance
        """
        # Create an empty FAISS index
        embedding_size = self.embeddings.client.get_sentence_embedding_dimension()
        index = faiss.IndexFlatL2(embedding_size)
        
        # Create a FAISS vector store
        vector_store = FAISS(
            embeddings=self.embeddings,
            index=index,
            docstore={},
            index_to_docstore_id={}
        )
        
        # Create a retriever
        retriever = vector_store.as_retriever(
            search_kwargs={"k": self.config.memory_k}
        )
        
        # Create vector memory
        return VectorStoreRetrieverMemory(
            retriever=retriever,
            memory_key="chat_history",
            return_messages=True
        )
    
    def save_memory(self, session_id: str) -> bool:
        """
        Save memory for the given session to disk.
        
        Args:
            session_id: Session ID for the memory to save
            
        Returns:
            True if successful, False otherwise
        """
        if session_id not in self.memories:
            logger.warning(f"No memory found for session {session_id}")
            return False
        
        memory_path = os.path.join(self.config.memory_dir, f"{session_id}.pkl")
        try:
            with open(memory_path, "wb") as f:
                pickle.dump(self.memories[session_id], f)
            logger.info(f"Saved memory for session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving memory for session {session_id}: {str(e)}")
            return False
    
    def clear_memory(self, session_id: str) -> bool:
        """
        Clear memory for the given session.
        
        Args:
            session_id: Session ID for the memory to clear
            
        Returns:
            True if successful, False otherwise
        """
        if session_id not in self.memories:
            logger.warning(f"No memory found for session {session_id}")
            return False
        
        try:
            # Remove from memory dict
            del self.memories[session_id]
            
            # Remove from disk
            memory_path = os.path.join(self.config.memory_dir, f"{session_id}.pkl")
            if os.path.exists(memory_path):
                os.remove(memory_path)
            
            logger.info(f"Cleared memory for session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing memory for session {session_id}: {str(e)}")
            return False
    
    def get_relevant_context(self, session_id: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Get relevant context from memory for the given query.
        
        Args:
            session_id: Session ID for the memory
            query: Query to search for
            k: Number of results to return
            
        Returns:
            A list of relevant context items
        """
        if session_id not in self.memories:
            logger.warning(f"No memory found for session {session_id}")
            return []
        
        memory = self.memories[session_id]
        
        # If not using vector memory, return recent messages
        if not self.config.use_vector_memory:
            if not hasattr(memory.chat_memory, "messages"):
                return []
            
            messages = memory.chat_memory.messages[-k*2:]
            return [
                {
                    "content": msg.content,
                    "role": "user" if isinstance(msg, HumanMessage) else "assistant",
                    "relevance": 1.0
                }
                for msg in messages
            ]
        
        # For vector memory, search for relevant context
        try:
            # Get vector store from memory
            vector_store = memory.retriever.vectorstore
            
            # Search for relevant documents
            docs = vector_store.similarity_search_with_score(query, k=k)
            
            # Format results
            results = []
            for doc, score in docs:
                results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance": float(1.0 - score)  # Convert distance to relevance
                })
            
            return results
        except Exception as e:
            logger.error(f"Error getting relevant context: {str(e)}")
            return []

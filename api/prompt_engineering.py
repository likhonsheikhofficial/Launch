# @author likhonsheikh
"""
Prompt Engineering module for Launch AI Generator.

This module provides functionality for creating, testing, and iterating on prompts
using LangSmith for evaluation and tracking.
"""

import logging
import json
import uuid
from typing import Dict, List, Any, Optional, Union, AsyncGenerator

from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_together import Together
from langchain.smith import RunEvalConfig, run_on_dataset
from langchain.smith import arun_on_dataset
from langchain.callbacks.tracers.langchain import wait_for_all_tracers
from langchain.evaluation import EvaluatorType
from langchain.evaluation.criteria import LabeledCriteriaEvalChain

from .config import config
from .security import sanitize_output

logger = logging.getLogger(__name__)

# System prompts for different use cases
SYSTEM_PROMPTS = {
    "default": """You are Launch, an AI-powered development assistant that helps users build applications.
You analyze user requirements and generate clean, production-ready code.

When generating code:
1. Focus on clean, maintainable, and production-ready code
2. Consider edge cases and error handling
3. Follow best practices for the language/framework being used
4. Provide clear comments and documentation

Think step-by-step about the user's request before responding.
""",
    "web_app": """You are Launch, an AI-powered web application generator.
You analyze user requirements and generate clean, production-ready web applications.

When generating code:
1. Use modern web frameworks and libraries
2. Implement responsive design principles
3. Follow security best practices
4. Structure code for maintainability and scalability
5. Include proper error handling and validation

Think step-by-step about the user's request before responding.
""",
    "api": """You are Launch, an AI-powered API generator.
You analyze user requirements and generate clean, production-ready API implementations.

When generating code:
1. Follow RESTful or GraphQL best practices
2. Implement proper authentication and authorization
3. Include input validation and error handling
4. Design for scalability and performance
5. Document the API endpoints thoroughly

Think step-by-step about the user's request before responding.
""",
    "data_analysis": """You are Launch, an AI-powered data analysis application generator.
You analyze user requirements and generate clean, production-ready data analysis applications.

When generating code:
1. Use appropriate data processing libraries
2. Implement efficient data handling techniques
3. Include data validation and cleaning steps
4. Create clear visualizations when appropriate
5. Document the analysis process thoroughly

Think step-by-step about the user's request before responding.
"""
}

# Evaluation criteria
EVALUATION_CRITERIA = {
    "correctness": "Does the generated code correctly implement the requested functionality?",
    "code_quality": "Is the code clean, well-structured, and following best practices?",
    "completeness": "Does the solution address all aspects of the user's request?",
    "security": "Does the code follow security best practices and avoid common vulnerabilities?",
    "maintainability": "Is the code easy to understand, modify, and maintain?"
}

class PromptEngineer:
    """
    Manages prompt engineering for the Launch AI Generator.
    
    This class provides functionality for creating, testing, and iterating on prompts
    using LangSmith for evaluation and tracking.
    """
    
    def __init__(self):
        """Initialize the PromptEngineer."""
        self.llm = self._initialize_llm()
    
    def _initialize_llm(self):
        """
        Initialize the language model based on configuration.
        
        Returns:
            A language model instance
        """
        if config.provider == "groq":
            if not config.groq_api_key:
                logger.error("Groq API key not configured. Please set GROQ_API_KEY environment variable.")
                raise ValueError("Groq API key not configured")
                
            return ChatGroq(
                model_name=config.model_name,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                api_key=config.groq_api_key,
                streaming=True
            )
        else:  # Default to Together
            if not config.together_api_key:
                logger.error("Together API key not configured. Please set TOGETHER_API_KEY environment variable.")
                raise ValueError("Together API key not configured")
                
            return Together(
                model=config.model_name,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                together_api_key=config.together_api_key,
                streaming=True
            )
    
    def create_prompt_template(self, prompt_type: str = "default", additional_context: str = "") -> ChatPromptTemplate:
        """
        Create a prompt template for the specified type.
        
        Args:
            prompt_type: Type of prompt to create (default, web_app, api, data_analysis)
            additional_context: Additional context to add to the system prompt
            
        Returns:
            A ChatPromptTemplate instance
        """
        system_prompt = SYSTEM_PROMPTS.get(prompt_type, SYSTEM_PROMPTS["default"])
        
        if additional_context:
            system_prompt = f"{system_prompt}\n\nAdditional context:\n{additional_context}"
        
        return ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
        ])
    
    async def generate_code(
        self, 
        user_input: str, 
        prompt_type: str = "default", 
        additional_context: str = "",
        chat_history: List[Union[HumanMessage, AIMessage]] = None
    ) -> Dict[str, Any]:
        """
        Generate code based on user input.
        
        Args:
            user_input: User's request
            prompt_type: Type of prompt to use
            additional_context: Additional context for the prompt
            chat_history: Optional chat history
            
        Returns:
            A dictionary containing the generated code and metadata
        """
        if chat_history is None:
            chat_history = []
        
        # Create prompt template
        prompt = self.create_prompt_template(prompt_type, additional_context)
        
        # Create chain
        chain = prompt | self.llm
        
        # Generate response
        response = await chain.ainvoke({
            "input": user_input,
            "chat_history": chat_history
        })
        
        # Extract code from response
        content = response.content if hasattr(response, "content") else str(response)
        
        # Sanitize output
        content = sanitize_output(content)
        
        return {
            "generated_code": content,
            "prompt_type": prompt_type,
            "model": config.model_name,
            "provider": config.provider,
            "run_id": response.id if hasattr(response, "id") else str(uuid.uuid4())
        }
    
    async def stream_code_generation(
        self, 
        user_input: str, 
        prompt_type: str = "default", 
        additional_context: str = "",
        chat_history: List[Union[HumanMessage, AIMessage]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream code generation based on user input.
        
        Args:
            user_input: User's request
            prompt_type: Type of prompt to use
            additional_context: Additional context for the prompt
            chat_history: Optional chat history
            
        Yields:
            Chunks of generated code
        """
        if chat_history is None:
            chat_history = []
        
        # Create prompt template
        prompt = self.create_prompt_template(prompt_type, additional_context)
        
        # Create chain
        chain = prompt | self.llm
        
        # Stream response
        async for chunk in chain.astream({
            "input": user_input,
            "chat_history": chat_history
        }):
            if hasattr(chunk, "content"):
                # Sanitize output
                content = sanitize_output(chunk.content)
                yield content
            else:
                # Handle different response formats
                content = sanitize_output(str(chunk))
                yield content
    
    async def evaluate_prompt(
        self, 
        prompt_type: str, 
        dataset_name: str = None,
        criteria: List[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a prompt using LangSmith.
        
        Args:
            prompt_type: Type of prompt to evaluate
            dataset_name: Name of the dataset to use for evaluation
            criteria: List of criteria to evaluate
            
        Returns:
            Evaluation results
        """
        if not config.langsmith_api_key:
            logger.warning("LangSmith API key not configured. Skipping evaluation.")
            return {"error": "LangSmith API key not configured"}
        
        if dataset_name is None:
            dataset_name = config.evaluation_dataset
        
        if criteria is None:
            criteria = list(EVALUATION_CRITERIA.keys())
        
        # Create prompt template
        prompt = self.create_prompt_template(prompt_type)
        
        # Create chain
        chain = prompt | self.llm
        
        # Create evaluators
        evaluators = []
        for criterion in criteria:
            if criterion in EVALUATION_CRITERIA:
                evaluator = LabeledCriteriaEvalChain.from_llm(
                    llm=self.llm,
                    criteria={criterion: EVALUATION_CRITERIA[criterion]}
                )
                evaluators.append(evaluator)
        
        # Run evaluation
        eval_config = RunEvalConfig(
            evaluators=evaluators,
            custom_evaluators=[],
            reference_key="expected_output"
        )
        
        results = await arun_on_dataset(
            dataset_name=dataset_name,
            llm_or_chain_factory=lambda: chain,
            evaluation=eval_config,
            project_name=f"{config.langsmith_project}-eval-{prompt_type}",
            concurrency_level=2,
            verbose=True
        )
        
        return results
    
    async def create_evaluation_dataset(
        self, 
        examples: List[Dict[str, Any]], 
        dataset_name: str = None
    ) -> str:
        """
        Create an evaluation dataset in LangSmith.
        
        Args:
            examples: List of examples to add to the dataset
            dataset_name: Name of the dataset to create
            
        Returns:
            Dataset name
        """
        if not config.langsmith_api_key:
            logger.warning("LangSmith API key not configured. Skipping dataset creation.")
            return None
        
        if dataset_name is None:
            dataset_name = config.evaluation_dataset
        
        from langsmith import Client
        
        client = Client(api_key=config.langsmith_api_key)
        
        # Check if dataset exists
        try:
            datasets = client.list_datasets(dataset_name=dataset_name)
            dataset_exists = any(d.name == dataset_name for d in datasets)
            
            if not dataset_exists:
                # Create dataset
                dataset = client.create_dataset(
                    dataset_name=dataset_name,
                    description="Evaluation dataset for Launch AI Generator"
                )
            
            # Add examples
            for example in examples:
                client.create_example(
                    inputs={"input": example["input"]},
                    outputs={"expected_output": example.get("expected_output", "")},
                    dataset_id=dataset_name
                )
            
            return dataset_name
        
        except Exception as e:
            logger.error(f"Error creating evaluation dataset: {str(e)}")
            return None

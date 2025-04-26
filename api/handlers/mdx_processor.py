"""
MDX Processing Handler for Launch
Processes MDX components and manages serverless execution
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, AIMessage
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class ComponentType(str, Enum):
    REACT = "react"
    NODEJS = "nodejs"
    HTML = "html"
    MARKDOWN = "markdown"
    DIAGRAM = "diagram"
    MATH = "math"
    CODE = "code"
    LINEAR_FLOW = "linear-flow"
    QUIZ = "quiz"

class MDXComponent(BaseModel):
    type: str
    props: Dict[str, Any] = Field(default_factory=dict)
    children: Optional[str] = None

class CodeBlock(BaseModel):
    content: str
    language: str
    project: Optional[str] = None
    file_path: Optional[str] = None
    type: ComponentType

class MDXProcessor:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self._setup_llm()
        self._setup_prompts()
        
    def _setup_llm(self):
        """Initialize LLM for content processing"""
        self.llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview",
            temperature=0.3
        )
    
    def _setup_prompts(self):
        """Initialize prompt templates for different content types"""
        self.prompts = {
            ComponentType.REACT: PromptTemplate(
                template="""Generate a React component based on the description:
                Description: {description}
                Requirements:
                - Use TypeScript and modern React patterns
                - Implement proper error handling
                - Include accessibility features
                - Follow project style guidelines
                
                Component:""",
                input_variables=["description"]
            ),
            ComponentType.DIAGRAM: PromptTemplate(
                template="""Create a Mermaid diagram based on the description:
                Description: {description}
                Requirements:
                - Use clear flow and structure
                - Include proper labels
                - Follow Mermaid syntax rules
                
                Diagram:""",
                input_variables=["description"]
            ),
            ComponentType.MATH: PromptTemplate(
                template="""Generate LaTeX for the mathematical expression:
                Description: {description}
                Requirements:
                - Use proper LaTeX syntax
                - Include all necessary symbols
                - Follow mathematical notation standards
                
                Expression:""",
                input_variables=["description"]
            )
        }

    async def process_mdx(self, content: str, language: str = "en") -> str:
        """Process MDX content with components and code blocks"""
        try:
            # Extract components and code blocks
            components = self._extract_components(content)
            code_blocks = self._extract_code_blocks(content)
            
            # Process each type of content
            processed_components = await self._process_components(components, language)
            processed_blocks = await self._process_code_blocks(code_blocks, language)
            
            # Combine processed content
            return self._combine_content(content, processed_components, processed_blocks)
        except Exception as e:
            logger.error(f"Error processing MDX: {str(e)}")
            raise

    def _extract_components(self, content: str) -> List[MDXComponent]:
        """Extract MDX components from content"""
        components = []
        pattern = r"<(\w+)([^>]*)(?:>(.*?)</\1>|/>)"
        matches = re.finditer(pattern, content, re.DOTALL)
        
        for match in matches:
            tag, props_str, children = match.groups()
            props = self._parse_props(props_str)
            
            components.append(MDXComponent(
                type=tag,
                props=props,
                children=children.strip() if children else None
            ))
        
        return components

    def _parse_props(self, props_str: str) -> Dict[str, Any]:
        """Parse component props from string"""
        props = {}
        if not props_str:
            return props
            
        pattern = r'(\w+)=(?:\"([^\"]+)\"|{(.*?)})'
        matches = re.finditer(pattern, props_str)
        
        for match in matches:
            key = match.group(1)
            value = match.group(2) or match.group(3)
            
            if match.group(3):  # JSON value
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON prop value: {value}")
                    
            props[key] = value
            
        return props

    async def _process_components(
        self,
        components: List[MDXComponent],
        language: str
    ) -> Dict[str, str]:
        """Process MDX components with type-specific handlers"""
        results = {}
        
        for component in components:
            try:
                processed = await self._process_component(component, language)
                key = json.dumps({
                    "type": component.type,
                    "props": component.props
                })
                results[key] = processed
            except Exception as e:
                logger.error(f"Error processing component {component.type}: {str(e)}")
                results[key] = f"Error: {str(e)}"
        
        return results

    async def _process_component(
        self,
        component: MDXComponent,
        language: str
    ) -> str:
        """Process a single MDX component"""
        try:
            # Get component-specific processor
            processor = getattr(self, f"_process_{component.type.lower()}", None)
            
            if processor:
                return await processor(component, language)
            
            # Default processing if no specific handler
            return json.dumps({
                "type": component.type,
                "props": component.props,
                "children": component.children
            })
            
        except Exception as e:
            logger.error(f"Error in component processor: {str(e)}")
            raise

    async def _process_code_blocks(
        self,
        blocks: List[CodeBlock],
        language: str
    ) -> Dict[str, str]:
        """Process code blocks with language-specific handlers"""
        results = {}
        
        for block in blocks:
            try:
                if block.type == ComponentType.REACT:
                    processed = await self._process_react_code(block, language)
                elif block.type == ComponentType.DIAGRAM:
                    processed = await self._process_diagram_code(block)
                elif block.type == ComponentType.MATH:
                    processed = await self._process_math_code(block)
                else:
                    # Default processing for other code types
                    processed = block.content
                    
                results[block.content] = processed
            except Exception as e:
                logger.error(f"Error processing code block: {str(e)}")
                results[block.content] = f"Error: {str(e)}"
        
        return results

    async def _process_react_code(self, block: CodeBlock, language: str) -> str:
        """Process React component code"""
        chain = LLMChain(llm=self.llm, prompt=self.prompts[ComponentType.REACT])
        response = await chain.arun(description=block.content)
        return response.strip()

    async def _process_diagram_code(self, block: CodeBlock) -> str:
        """Process Mermaid diagram code"""
        chain = LLMChain(llm=self.llm, prompt=self.prompts[ComponentType.DIAGRAM])
        response = await chain.arun(description=block.content)
        return response.strip()

    async def _process_math_code(self, block: CodeBlock) -> str:
        """Process LaTeX math expressions"""
        chain = LLMChain(llm=self.llm, prompt=self.prompts[ComponentType.MATH])
        response = await chain.arun(description=block.content)
        return response.strip()

    def _combine_content(
        self,
        original: str,
        processed_components: Dict[str, str],
        processed_blocks: Dict[str, str]
    ) -> str:
        """Combine processed content back into MDX"""
        result = original
        
        # Replace processed components
        for original_component, processed in processed_components.items():
            component_data = json.loads(original_component)
            component_str = self._build_component_string(component_data)
            result = result.replace(component_str, processed)
        
        # Replace processed code blocks
        for original_block, processed in processed_blocks.items():
            result = result.replace(original_block, processed)
        
        return result

    def _build_component_string(self, component_data: Dict[str, Any]) -> str:
        """Build original component string for replacement"""
        props_str = " ".join(
            f'{k}="{v}"' if isinstance(v, str) else f'{k}={json.dumps(v)}'
            for k, v in component_data["props"].items()
        )
        
        return f'<{component_data["type"]} {props_str}/>'

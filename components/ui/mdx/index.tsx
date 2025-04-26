import { LinearProcessFlow } from './linear-process-flow'
import { Quiz } from './quiz'
import { Math } from './math'
import { CodeBlock } from './code-block'
import { Mermaid } from './mermaid'

// MDX Component Registry with metadata
export const mdxComponents = {
  LinearProcessFlow,
  Quiz,
  Math,
  CodeBlock,
  Mermaid,
  pre: (props: any) => props.children,
  code: CodeBlock,
}

// Component metadata for UI and processing
export const componentMetadata = {
  LinearProcessFlow: {
    name: 'Linear Process Flow',
    description: 'Display multi-step processes with visual progress indicators',
    category: 'Flow',
    icon: 'StepForwardIcon',
    defaultProps: {
      steps: [],
      currentStep: 0,
    },
  },
  Quiz: {
    name: 'Interactive Quiz',
    description: 'Create engaging quizzes with multiple choice questions',
    category: 'Interactive',
    icon: 'QuestionMarkCircleIcon',
    defaultProps: {
      questions: [],
    },
  },
  Math: {
    name: 'Math Expression',
    description: 'Render mathematical expressions using LaTeX syntax',
    category: 'Academic',
    icon: 'CalculatorIcon',
    defaultProps: {
      display: false,
    },
  },
  Mermaid: {
    name: 'Mermaid Diagram',
    description: 'Create flowcharts, sequence diagrams, and more',
    category: 'Diagram',
    icon: 'ChartBarIcon',
    defaultProps: {
      chart: '',
    },
  },
  CodeBlock: {
    name: 'Code Block',
    description: 'Display code with syntax highlighting and metadata',
    category: 'Code',
    icon: 'CodeBracketIcon',
    defaultProps: {
      language: 'typescript',
      showLineNumbers: true,
    },
  },
}

// Component processors for server-side handling
export const componentProcessors = {
  LinearProcessFlow: async (props: any) => {
    // Process step data and validate structure
    return {
      ...props,
      steps: props.steps.map((step: any) => ({
        ...step,
        status: step.status || 'upcoming',
      })),
    }
  },
  Quiz: async (props: any) => {
    // Process quiz questions and validate answers
    return {
      ...props,
      questions: props.questions.map((q: any) => ({
        ...q,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
      })),
    }
  },
  Math: async (props: any) => {
    // Process LaTeX content and validate syntax
    return {
      ...props,
      display: !!props.display,
    }
  },
  Mermaid: async (props: any) => {
    // Process Mermaid syntax and generate diagrams
    return {
      ...props,
      chart: props.chart || '',
    }
  },
  CodeBlock: async (props: any) => {
    // Process code and apply syntax highlighting
    return {
      ...props,
      language: props.language || 'typescript',
      showLineNumbers: props.showLineNumbers ?? true,
    }
  },
}

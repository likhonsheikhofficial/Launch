/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

# Launch AI Generator

Launch is a powerful system that turns ideas into full, production-ready applications using AI and Python. Through advanced prompt engineering, Launch follows a unique workflow to generate clean, professional Python codebases.

## Features

- **AI-Powered Code Generation**: Generate clean, production-ready code from natural language descriptions
- **Prompt Engineering**: Test and iterate on prompts with LangSmith integration
- **Evaluation Framework**: Evaluate prompt performance with customizable criteria
- **Version History**: Track and manage different versions of generated code
- **Feedback System**: Collect and analyze user feedback for continuous improvement
- **Security**: Rate limiting, input sanitization, and API key authentication
- **Streaming Responses**: Real-time code generation with streaming API

## Architecture

Launch AI Generator is built with a modular architecture:

- **Flask Backend**: Handles HTTP requests and serves the web interface
- **LangChain Integration**: Provides the core AI functionality
- **LangSmith Observability**: Monitors and evaluates AI performance
- **Prompt Engineering System**: Manages and optimizes prompts
- **Security Layer**: Protects against abuse and attacks

## Security Features

- **Rate Limiting**: Prevents abuse through request rate limiting via Flask-Limiter
- **Input Sanitization**: All user inputs are validated and sanitized
- **API Key Authentication**: Optional API key authentication for protected endpoints
- **HTTPS Enforcement**: All traffic goes over TLS/SSL (Vercel endpoints are HTTPS by default)
- **Secure Headers**: Security headers to prevent common web vulnerabilities
- **Environment Secret Management**: Credentials stored only in environment variables or Vercel Secrets

## Scalability & Extensibility

- **Stateless Serverless**: Flask functions remain stateless, allowing auto-scaling with demand
- **Streaming Responses**: Use LangChain's streaming APIs to yield partial results immediately
- **Caching**: Optional caching for improved performance
- **Modular Design**: New capabilities can be added without changing the core

## Prerequisites

- Python 3.9+
- OpenAI API key or Together AI API key
- LangSmith API key (for observability and evaluations)

## Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/launch-ai-generator.git
   cd launch-ai-generator
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   # LLM configuration
   export OPENAI_API_KEY=your_openai_api_key
   # or
   export TOGETHER_API_KEY=your_together_api_key
   export MODEL_NAME=gpt-4o  # or another model

   # LangSmith configuration
   export LANGSMITH_API_KEY=your_langsmith_api_key
   export LANGSMITH_PROJECT=launch-ai-generator
   
   # Security configuration
   export API_KEYS=key1,key2,key3  # Optional, comma-separated list of valid API keys
   export RATE_LIMIT_REQUESTS=10  # Optional, default is 10
   export RATE_LIMIT_WINDOW=60  # Optional, default is 60 seconds
   \`\`\`

4. Run the application:
   \`\`\`bash
   python main.py
   \`\`\`

5. Open your browser and navigate to `http://localhost:8000`

## LangSmith Integration

Launch AI Generator integrates with LangSmith for observability and evaluations:

### Observability

- **Trace Runs**: Every code generation is traced in LangSmith
- **Monitor Performance**: Track latency, token usage, and other metrics
- **Debug Issues**: Identify and fix problems in your prompts

### Evaluations

Launch includes a built-in evaluation framework:

1. **Create Datasets**: Build evaluation datasets with example inputs and expected outputs
2. **Define Criteria**: Evaluate generated code on correctness, code quality, completeness, security, and maintainability
3. **Run Evaluations**: Test different prompts against your datasets
4. **Analyze Results**: Compare performance across different prompts and models

## Prompt Engineering

The system includes a prompt engineering module that allows you to:

1. **Create Prompts**: Design specialized prompts for different types of applications
2. **Test Variations**: Try different prompt formulations
3. **Collect Feedback**: Gather user feedback on generated code
4. **Iterate**: Continuously improve prompts based on evaluations and feedback

## Deployment

### Vercel

1. Install Vercel CLI:
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. Set up environment variables in Vercel:
   \`\`\`bash
   vercel env add TOGETHER_API_KEY
   # or
   vercel env add OPENAI_API_KEY
   
   # Optional: Add LangSmith API key
   vercel env add LANGSMITH_API_KEY
   
   # Optional: Add API keys for authentication
   vercel env add API_KEYS
   \`\`\`

3. Deploy:
   \`\`\`bash
   vercel --prod
   \`\`\`

### Docker

1. Build the Docker image:
   \`\`\`bash
   docker build -t launch-ai-generator .
   \`\`\`

2. Run the container:
   \`\`\`bash
   docker run -p 8000:8000 -e OPENAI_API_KEY=your_key -e LANGSMITH_API_KEY=your_key launch-ai-generator
   \`\`\`

## API Reference

### Generate Code

\`\`\`
POST /api/generate
\`\`\`

Request body:
\`\`\`json
{
  "prompt": "Create a Flask application with user authentication",
  "prompt_type": "web_app",
  "additional_context": "Use SQLAlchemy for the database"
}
\`\`\`

### Stream Code Generation

\`\`\`
POST /api/stream-generate
\`\`\`

Request body:
\`\`\`json
{
  "prompt": "Create a Flask application with user authentication",
  "prompt_type": "web_app",
  "additional_context": "Use SQLAlchemy for the database"
}
\`\`\`

Response: Server-Sent Events (SSE) stream

### Evaluate Prompt

\`\`\`
POST /api/evaluate
\`\`\`

Request body:
\`\`\`json
{
  "prompt_type": "web_app",
  "dataset_name": "web_app_examples",
  "criteria": ["correctness", "code_quality"]
}
\`\`\`

### Create Dataset

\`\`\`
POST /api/dataset
\`\`\`

Request body:
\`\`\`json
{
  "dataset_name": "web_app_examples",
  "examples": [
    {
      "input": "Create a Flask application with user authentication",
      "expected_output": "..."
    }
  ]
}
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

## Author

[Likhon Sheikh](https://github.com/likhonsheikhofficial)

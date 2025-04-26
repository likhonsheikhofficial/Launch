/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

# Launch AI Generator - Deployment Guide

This guide provides detailed instructions for deploying the Launch AI Generator on Vercel, including configuration steps and troubleshooting tips.

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel](https://vercel.com) account
2. A [Together AI](https://together.ai) API key
3. Optional: A [LangSmith](https://smith.langchain.com) API key for monitoring
4. Optional: A [Tavily](https://tavily.com) API key for search functionality
5. [Node.js](https://nodejs.org) installed (for Vercel CLI)
6. [Git](https://git-scm.com) installed

## Deployment Steps

### 1. Prepare Your Repository

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/launch-ai-generator.git
   cd launch-ai-generator
   \`\`\`

2. Ensure your `vercel.json` file is correctly configured:
   \`\`\`json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/index.py",
         "use": "@vercel/python"
       },
       {
         "src": "static/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/static/(.*)",
         "dest": "/static/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/api/index.py"
       }
     ],
     "env": {
       "PYTHONUNBUFFERED": "1"
     }
   }
   \`\`\`

3. Verify your `requirements.txt` file includes all necessary dependencies.

### 2. Set Up Vercel CLI

1. Install Vercel CLI:
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. Log in to Vercel:
   \`\`\`bash
   vercel login
   \`\`\`

### 3. Configure Environment Variables

1. Set up environment variables using the Vercel CLI:
   \`\`\`bash
   vercel env add TOGETHER_API_KEY
   # Enter your Together API key when prompted
   
   # Optional: Add LangSmith API key
   vercel env add LANGCHAIN_API_KEY
   
   # Optional: Add Tavily API key
   vercel env add TAVILY_API_KEY
   \`\`\`

2. Alternatively, you can set environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" section
   - Add each required variable

### 4. Deploy to Vercel

1. Deploy your application:
   \`\`\`bash
   vercel --prod
   \`\`\`

2. Follow the prompts to configure your project:
   - Select your Vercel scope/account
   - Confirm the project name
   - Specify the directory to deploy (usually the current directory)

3. Wait for the deployment to complete. Vercel will provide a URL for your deployed application.

### 5. Verify Deployment

1. Open the provided URL in your browser
2. Check the `/health` endpoint to verify API connections:
   \`\`\`
   https://your-deployment-url.vercel.app/health
   \`\`\`

3. Test the application functionality

### 6. Set Up Custom Domain (Optional)

1. In the Vercel dashboard, go to your project settings
2. Navigate to the "Domains" section
3. Add your custom domain and follow the instructions to configure DNS

## Serverless Optimization

### Memory Management

The serverless environment has limitations on `/tmp` directory persistence. To optimize:

1. Use minimal dependencies in the main handler
2. Implement lazy loading for heavy libraries
3. Consider external storage for persistent data

### Cold Start Optimization

To minimize cold start times:

1. Split your application into smaller functions
2. Use lazy imports for non-critical dependencies
3. Implement a warm-up mechanism:
   ```python
   # Example warm-up endpoint
   @app.get("/warmup")
   async def warmup():
       """Warm up the serverless function"""
       return {"status": "warmed up"}
   \`\`\`

4. Set up a scheduled job to ping your application periodically:
   \`\`\`bash
   # Using a cron job or external service
   curl -s https://your-deployment-url.vercel.app/warmup > /dev/null
   \`\`\`

### Function Execution Limits

Be aware of Vercel's execution limits:

1. Maximum execution duration: 10 seconds (Hobby), 60 seconds (Pro)
2. Maximum memory: 1024 MB
3. Maximum payload size: 4.5 MB

Design your application to work within these constraints:

1. Implement timeouts for external API calls
2. Use streaming responses for long-running operations
3. Optimize memory usage, especially for FAISS and embedding models

## Monitoring and Logging

### LangSmith Integration

If you've configured LangSmith:

1. Verify traces are appearing in your LangSmith dashboard
2. Set up alerts for errors or performance issues
3. Use trace data to optimize prompts and tool usage

### Vercel Logs

1. Access logs in the Vercel dashboard:
   - Go to your project
   - Navigate to the "Logs" section
   - Filter by function or status code

2. Set up log draining to an external service for long-term storage and analysis

## Troubleshooting

### Common Issues

1. **Cold Start Timeouts**:
   - Symptom: First request after inactivity times out
   - Solution: Implement warm-up mechanism, optimize dependencies

2. **Memory Errors**:
   - Symptom: Function crashes with memory-related errors
   - Solution: Reduce memory usage, especially for FAISS indexes

3. **Missing Environment Variables**:
   - Symptom: API calls fail with authentication errors
   - Solution: Verify environment variables are correctly set in Vercel

4. **WebSocket Connection Issues**:
   - Symptom: WebSocket connections fail to establish
   - Solution: Ensure your Vercel plan supports WebSockets (Pro plan required)

### Debugging Steps

1. Check the `/debug` endpoint (in non-production environments):
   \`\`\`
   https://your-deployment-url.vercel.app/debug
   \`\`\`

2. Review function logs in the Vercel dashboard

3. Test locally before deploying:
   \`\`\`bash
   vercel dev
   \`\`\`

4. If issues persist, try a clean deployment:
   \`\`\`bash
   vercel --prod --force
   \`\`\`

## Scaling Considerations

### Upgrading Your Plan

Consider upgrading to a Vercel Pro plan for:
- Longer execution times (60s vs 10s)
- More concurrent executions
- WebSocket support
- Team collaboration features

### External Services

For high-volume deployments, consider:
1. Moving vector storage to a dedicated service like Pinecone or Weaviate
2. Using Redis for rate limiting and caching
3. Implementing a CDN for static assets

## Conclusion

Deploying to Vercel provides a simple and scalable way to host your Launch AI Generator. By following this guide and implementing the optimization strategies, you can ensure a reliable and performant deployment.

For additional support, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI on Vercel](https://vercel.com/guides/using-fastapi-on-vercel)
- [LangChain Documentation](https://python.langchain.com/docs/get_started)
\`\`\`

Let's create a .gitignore file:

```plaintext file=".gitignore"
# @author likhonsheikh

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
.env

# IDE
.idea/
.vscode/
*.swp
*.swo

# Vercel
.vercel
.now

# Logs
logs/
*.log

# Temporary files
tmp/
.DS_Store

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# FAISS indexes
*.index

# Model cache
.cache/
.embeddings/

# Memory files
memory/
*.pkl

# Uploads
uploads/
versions/

/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

// Chat interface functionality
class LaunchChat {
  constructor() {
    this.chatMessages = document.getElementById("chat-messages")
    this.chatInput = document.getElementById("chat-input-text")
    this.sendButton = document.getElementById("chat-send-btn")
    this.thinkingStates = [
      "Analyzing your request...",
      "Formulating architecture...",
      "Designing components...",
      "Implementing solution...",
      "Optimizing code...",
      "Finalizing output...",
    ]
    this.currentVersion = null
    this.messageHistory = []
    this.toolPanels = {}

    // Initialize agent client
    this.agentClient = new AgentClient()
    this.agentClient.setOnMessage(this.handleAgentResponse.bind(this))
    this.agentClient.setOnThinking(this.handleAgentThinking.bind(this))
    this.agentClient.setOnError(this.handleAgentError.bind(this))
    this.agentClient.initWebSocket()

    this.init()
  }

  init() {
    // Initialize event listeners
    this.sendButton.addEventListener("click", () => this.sendMessage())
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    // Initialize tool buttons
    document.querySelectorAll(".chat-tool").forEach((button) => {
      button.addEventListener("click", () => this.activateTool(button.dataset.tool))
    })

    // Add welcome message
    this.addAIMessage(
      "Hi there! I'm Launch, your AI-powered development assistant. What would you like to build today?",
    )
  }

  sendMessage() {
    const message = this.chatInput.value.trim()
    if (!message) return

    // Add user message to chat
    this.addUserMessage(message)

    // Clear input
    this.chatInput.value = ""

    // Start thinking animation
    this.startThinking()

    // Send to agent
    this.agentClient.sendMessageWs(message).catch((error) => {
      this.stopThinking()
      this.addAIMessage(`Error: ${error.message}`)
    })
  }

  handleAgentResponse(data) {
    // Stop thinking animation
    this.stopThinking()

    // Add AI response
    this.addAIMessage(data.message, true)

    // Display tool usage if any
    if (data.tool_usage && data.tool_usage.length > 0) {
      this.addToolUsageInfo(data.tool_usage)
    }
  }

  handleAgentThinking(data) {
    // Update thinking state if already thinking
    const thinkingEl = document.getElementById("thinking-indicator")
    if (thinkingEl) {
      const thinkingText = thinkingEl.querySelector(".thinking-text")
      if (thinkingText) {
        thinkingText.textContent = data.message || "Thinking..."
      }
    } else {
      // Start thinking animation if not already thinking
      this.startThinking(data.message)
    }
  }

  handleAgentError(data) {
    // Stop thinking animation
    this.stopThinking()

    // Add error message
    this.addAIMessage(`Error: ${data.message}`)
  }

  addToolUsageInfo(toolUsage) {
    const toolUsageEl = document.createElement("div")
    toolUsageEl.className = "chat-message ai"

    let toolUsageContent = "<div class='chat-message-content'><strong>Tools used:</strong><ul>"

    toolUsage.forEach((tool) => {
      toolUsageContent += `<li><strong>${tool.tool}</strong>: ${this.escapeHTML(JSON.stringify(tool.input))}</li>`
    })

    toolUsageContent += "</ul></div>"
    toolUsageContent += `<div class="chat-message-meta">${this.getCurrentTime()}</div>`

    toolUsageEl.innerHTML = toolUsageContent
    this.chatMessages.appendChild(toolUsageEl)
    this.scrollToBottom()
  }

  addUserMessage(message) {
    const messageEl = document.createElement("div")
    messageEl.className = "chat-message user"
    messageEl.innerHTML = `
      <div class="chat-message-content">${this.escapeHTML(message)}</div>
      <div class="chat-message-meta">${this.getCurrentTime()}</div>
    `
    this.chatMessages.appendChild(messageEl)
    this.scrollToBottom()

    // Add to history
    this.messageHistory.push({
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    })
  }

  addAIMessage(message, isCode = false) {
    const messageEl = document.createElement("div")
    messageEl.className = "chat-message ai"

    if (isCode) {
      const codeBlock = this.createCodeBlock(message)
      messageEl.innerHTML = `
        <div class="chat-message-content">${codeBlock}</div>
        <div class="chat-message-meta">${this.getCurrentTime()}</div>
      `
    } else {
      messageEl.innerHTML = `
        <div class="chat-message-content">${message}</div>
        <div class="chat-message-meta">${this.getCurrentTime()}</div>
      `
    }

    this.chatMessages.appendChild(messageEl)
    this.scrollToBottom()

    // Add to history
    this.messageHistory.push({
      role: "assistant",
      content: message,
      timestamp: new Date().toISOString(),
    })
  }

  startThinking(message = "Analyzing your request...") {
    // Create thinking indicator
    const thinkingEl = document.createElement("div")
    thinkingEl.className = "thinking-indicator"
    thinkingEl.id = "thinking-indicator"
    thinkingEl.innerHTML = `
      <div class="thinking-text">${message}</div>
      <div class="thinking-dots">
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      </div>
    `
    this.chatMessages.appendChild(thinkingEl)
    this.scrollToBottom()

    // Cycle through thinking states
    let stateIndex = 0
    this.thinkingInterval = setInterval(() => {
      stateIndex = (stateIndex + 1) % this.thinkingStates.length
      const thinkingText = document.querySelector(".thinking-text")
      if (thinkingText) {
        thinkingText.textContent = this.thinkingStates[stateIndex]
      }
    }, 3000)
  }

  stopThinking() {
    clearInterval(this.thinkingInterval)
    const thinkingEl = document.getElementById("thinking-indicator")
    if (thinkingEl) {
      thinkingEl.remove()
    }
  }

  async generateResponse(prompt) {
    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("model", "groq")

      // Get selected template if any
      const templateInput = document.getElementById("template-input")
      if (templateInput && templateInput.value) {
        formData.append("template", templateInput.value)
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Stop thinking animation
      this.stopThinking()

      // Add AI response
      this.addAIMessage(data.generated, true)

      // Save current version
      this.currentVersion = data.version

      // Add version card
      this.addVersionCard(data.version)

      // Refresh versions list
      this.refreshVersions()
    } catch (error) {
      this.stopThinking()
      this.addAIMessage(`Error: ${error.message}`)
    }
  }

  createCodeBlock(code) {
    return `
      <div class="code-block">
        <div class="code-block-header">
          <div class="code-block-title">Generated Code</div>
          <div class="code-block-actions">
            <button class="code-block-btn" onclick="chat.copyCode(this)">Copy</button>
            <button class="code-block-btn" onclick="chat.deployCode(this)">Deploy</button>
          </div>
        </div>
        <pre>${this.escapeHTML(code)}</pre>
      </div>
    `
  }

  addVersionCard(version) {
    const versionEl = document.createElement("div")
    versionEl.className = "version-card"
    versionEl.innerHTML = `
      <div class="version-card-header">
        <div class="version-card-title">${version.tag}</div>
        <div class="version-card-actions">
          <button class="version-card-btn" onclick="chat.viewVersion('${version.timestamp}')">View</button>
          <button class="version-card-btn" onclick="chat.restoreVersion('${version.timestamp}')">Restore</button>
        </div>
      </div>
      <div class="version-card-content">${version.prompt}</div>
      <div class="version-card-meta">
        <span class="version-template">${version.template ? version.template.replace("_", " ") : "Custom"}</span>
        <span class="version-model">${version.model || "groq"}</span>
        <span class="version-date">${new Date(version.date).toLocaleString()}</span>
      </div>
    `
    this.chatMessages.appendChild(versionEl)
    this.scrollToBottom()
  }

  async viewVersion(timestamp) {
    try {
      const response = await fetch(`/api/version/${timestamp}`)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Add AI message with version code
      this.addAIMessage(`Showing version ${data.version.tag}:`, false)
      this.addAIMessage(data.code, true)
    } catch (error) {
      this.addAIMessage(`Error viewing version: ${error.message}`)
    }
  }

  async restoreVersion(timestamp) {
    try {
      const response = await fetch(`/api/version/${timestamp}`)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Add AI message with restored version
      this.addAIMessage(`Restored version ${data.version.tag}:`, false)
      this.addAIMessage(data.code, true)
    } catch (error) {
      this.addAIMessage(`Error restoring version: ${error.message}`)
    }
  }

  async refreshVersions() {
    try {
      const response = await fetch("/api/versions")

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Update versions in history tool panel
      if (this.toolPanels.history) {
        const versionsHTML = data.versions
          .map(
            (version) => `
          <div class="version-card">
            <div class="version-card-header">
              <div class="version-card-title">${version.tag}</div>
              <div class="version-card-actions">
                <button class="version-card-btn" onclick="chat.viewVersion('${version.timestamp}')">View</button>
                <button class="version-card-btn" onclick="chat.restoreVersion('${version.timestamp}')">Restore</button>
              </div>
            </div>
            <div class="version-card-content">${version.prompt}</div>
            <div class="version-card-meta">
              <span class="version-template">${version.template ? version.template.replace("_", " ") : "Custom"}</span>
              <span class="version-model">${version.model || "groq"}</span>
              <span class="version-date">${new Date(version.date).toLocaleString()}</span>
            </div>
          </div>
        `,
          )
          .join("")

        this.toolPanels.history.querySelector(".tool-panel-content").innerHTML = versionsHTML
      }
    } catch (error) {
      console.error("Error refreshing versions:", error)
    }
  }

  copyCode(button) {
    const codeBlock = button.closest(".code-block")
    const code = codeBlock.querySelector("pre").textContent

    navigator.clipboard
      .writeText(code)
      .then(() => {
        const originalText = button.textContent
        button.textContent = "Copied!"
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      })
      .catch((err) => {
        this.addAIMessage(`Failed to copy: ${err}`)
      })
  }

  deployCode(button) {
    const deployModal = document.getElementById("deploy-modal")
    deployModal.style.display = "flex"
  }

  activateTool(toolName) {
    // Check if tool panel already exists
    if (this.toolPanels[toolName]) {
      // Toggle visibility
      const panel = this.toolPanels[toolName]
      if (panel.classList.contains("hidden")) {
        panel.classList.remove("hidden")
      } else {
        panel.classList.add("hidden")
      }
      return
    }

    // Create tool panel
    const toolPanel = document.createElement("div")
    toolPanel.className = "tool-panel"

    switch (toolName) {
      case "history":
        toolPanel.innerHTML = `
          <div class="tool-panel-header">
            <div class="tool-panel-title">Version History</div>
            <div class="tool-panel-close" onclick="chat.closeTool('history')">&times;</div>
          </div>
          <div class="tool-panel-content">
            <div class="loading-message">Loading versions...</div>
          </div>
        `
        this.refreshVersions()
        break

      case "templates":
        toolPanel.innerHTML = `
          <div class="tool-panel-header">
            <div class="tool-panel-title">Project Templates</div>
            <div class="tool-panel-close" onclick="chat.closeTool('templates')">&times;</div>
          </div>
          <div class="tool-panel-content">
            <div class="template-buttons">
              <button class="template-btn" onclick="selectTemplate('landing_page'); chat.closeTool('templates')">
                <span class="icon">🏠</span>
                <span>Landing Page</span>
              </button>
              <button class="template-btn" onclick="selectTemplate('sign_up_form'); chat.closeTool('templates')">
                <span class="icon">📝</span>
                <span>Sign Up Form</span>
              </button>
              <button class="template-btn" onclick="selectTemplate('dashboard'); chat.closeTool('templates')">
                <span class="icon">📊</span>
                <span>Dashboard</span>
              </button>
              <button class="template-btn" onclick="selectTemplate('blog'); chat.closeTool('templates')">
                <span class="icon">📰</span>
                <span>Blog</span>
              </button>
              <button class="template-btn" onclick="selectTemplate('calculator'); chat.closeTool('templates')">
                <span class="icon">🧮</span>
                <span>Calculator</span>
              </button>
              <button class="template-btn" onclick="selectTemplate('e_commerce'); chat.closeTool('templates')">
                <span class="icon">🛒</span>
                <span>E-commerce</span>
              </button>
            </div>
          </div>
        `
        break

      case "screenshot":
        toolPanel.innerHTML = `
          <div class="tool-panel-header">
            <div class="tool-panel-title">Upload Screenshot</div>
            <div class="tool-panel-close" onclick="chat.closeTool('screenshot')">&times;</div>
          </div>
          <div class="tool-panel-content">
            <form id="screenshot-form">
              <div class="file-upload">
                <label for="screenshot-image">
                  <span class="upload-icon">📷</span>
                  <span>Choose image</span>
                </label>
                <input type="file" id="screenshot-image" name="image" accept="image/*">
              </div>
              <div class="tool-panel-actions">
                <button type="button" class="primary-btn" onclick="chat.processScreenshot()">Generate from Screenshot</button>
              </div>
            </form>
          </div>
        `

        // Add event listener for file input
        setTimeout(() => {
          const fileInput = document.getElementById("screenshot-image")
          fileInput.addEventListener("change", () => {
            const fileName = fileInput.files[0]?.name
            if (fileName) {
              const label = fileInput.previousElementSibling
              label.querySelector("span:last-child").textContent =
                fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName
            }
          })
        }, 100)
        break

      case "edit":
        toolPanel.innerHTML = `
          <div class="tool-panel-header">
            <div class="tool-panel-title">Edit Code</div>
            <div class="tool-panel-close" onclick="chat.closeTool('edit')">&times;</div>
          </div>
          <div class="tool-panel-content">
            <textarea id="code-editor" placeholder="Paste code to edit here..." rows="10" class="code-editor"></textarea>
            <div class="tool-panel-actions">
              <button class="secondary-btn" onclick="chat.clearEditor()">Clear</button>
              <button class="primary-btn" onclick="chat.updateCode()">Update Code</button>
            </div>
          </div>
        `
        break
    }

    this.chatMessages.appendChild(toolPanel)
    this.toolPanels[toolName] = toolPanel
    this.scrollToBottom()
  }

  closeTool(toolName) {
    if (this.toolPanels[toolName]) {
      this.toolPanels[toolName].classList.add("hidden")
    }
  }

  async processScreenshot() {
    const fileInput = document.getElementById("screenshot-image")

    if (!fileInput.files || fileInput.files.length === 0) {
      this.addAIMessage("Please select an image file")
      return
    }

    const file = fileInput.files[0]

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      this.addAIMessage("Please select a valid image file")
      return
    }

    // Start thinking animation
    this.startThinking()

    // Close screenshot tool
    this.closeTool("screenshot")

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/screenshot", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Stop thinking animation
      this.stopThinking()

      // Add AI response with image
      this.addAIMessage("I've generated UI based on your screenshot:")

      const imageEl = document.createElement("div")
      imageEl.className = "chat-message ai"
      imageEl.innerHTML = `
        <div class="chat-message-content">
          <img src="data:image/png;base64,${data.image}" alt="Generated UI" style="max-width: 100%;">
        </div>
        <div class="chat-message-meta">${this.getCurrentTime()}</div>
      `
      this.chatMessages.appendChild(imageEl)
      this.scrollToBottom()
    } catch (error) {
      this.stopThinking()
      this.addAIMessage(`Error processing screenshot: ${error.message}`)
    }
  }

  clearEditor() {
    const editor = document.getElementById("code-editor")
    if (editor) {
      editor.value = ""
    }
  }

  updateCode() {
    const editor = document.getElementById("code-editor")
    if (editor && editor.value.trim()) {
      this.addAIMessage("Updated code:")
      this.addAIMessage(editor.value, true)
      this.closeTool("edit")
    } else {
      this.addAIMessage("Please enter some code to update")
    }
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight
  }

  getCurrentTime() {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  escapeHTML(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize chat when DOM is loaded
let chat
document.addEventListener("DOMContentLoaded", () => {
  chat = new LaunchChat()
})

class AgentClient {
  constructor() {
    this.ws = null
    this.onMessage = null
    this.onThinking = null
    this.onError = null
  }

  initWebSocket() {
    this.ws = new WebSocket("ws://localhost:8000/ws")

    this.ws.onopen = () => {
      console.log("WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "message" && this.onMessage) {
        this.onMessage(data)
      } else if (data.type === "thinking" && this.onThinking) {
        this.onThinking(data)
      } else if (data.type === "error" && this.onError) {
        this.onError(data)
      }
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      // Attempt to reconnect after a delay
      setTimeout(() => this.initWebSocket(), 3000)
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  sendMessageWs(message) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ message: message }))
        resolve()
      } else {
        reject(new Error("WebSocket is not connected."))
      }
    })
  }

  setOnMessage(callback) {
    this.onMessage = callback
  }

  setOnThinking(callback) {
    this.onThinking = callback
  }

  setOnError(callback) {
    this.onError = callback
  }
}

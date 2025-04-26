/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

// Agent client for interacting with the LangChain agent
class AgentClient {
  constructor() {
    this.baseUrl = window.location.origin
    this.threadId = null
    this.socket = null
    this.onMessage = null
    this.onThinking = null
    this.onError = null
    this.isConnected = false
  }

  /**
   * Initialize the WebSocket connection
   */
  initWebSocket() {
    if (this.socket) {
      this.socket.close()
    }

    const clientId = this.generateClientId()
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${wsProtocol}//${window.location.host}/api/agent/ws/${clientId}`

    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      console.log("WebSocket connection established")
      this.isConnected = true
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.thread_id) {
        this.threadId = data.thread_id
      }

      if (data.type === "thinking" && this.onThinking) {
        this.onThinking(data)
      } else if (data.type === "response" && this.onMessage) {
        this.onMessage(data)
      } else if (data.type === "error" && this.onError) {
        this.onError(data)
      }
    }

    this.socket.onclose = () => {
      console.log("WebSocket connection closed")
      this.isConnected = false

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!this.isConnected) {
          this.initWebSocket()
        }
      }, 3000)
    }

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error)
      if (this.onError) {
        this.onError({ message: "WebSocket connection error" })
      }
    }
  }

  /**
   * Send a message to the agent via WebSocket
   * @param {string} message - The message to send
   */
  async sendMessageWs(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.initWebSocket()

      // Wait for connection to establish
      await new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve()
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    this.socket.send(
      JSON.stringify({
        message,
        thread_id: this.threadId,
      }),
    )
  }

  /**
   * Send a message to the agent via HTTP
   * @param {string} message - The message to send
   * @returns {Promise<object>} - The agent's response
   */
  async sendMessageHttp(message) {
    try {
      const response = await fetch(`${this.baseUrl}/api/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          thread_id: this.threadId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = await response.json()

      if (data.thread_id) {
        this.threadId = data.thread_id
      }

      return data
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Generate a unique client ID
   * @returns {string} - A unique client ID
   */
  generateClientId() {
    return "client_" + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Set the callback for receiving messages
   * @param {function} callback - The callback function
   */
  setOnMessage(callback) {
    this.onMessage = callback
  }

  /**
   * Set the callback for thinking state
   * @param {function} callback - The callback function
   */
  setOnThinking(callback) {
    this.onThinking = callback
  }

  /**
   * Set the callback for errors
   * @param {function} callback - The callback function
   */
  setOnError(callback) {
    this.onError = callback
  }
}

// Export the agent client
window.AgentClient = AgentClient

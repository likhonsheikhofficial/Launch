/**
 * @author likhonsheikh
 * @license AGPL-3.0
 * @link https://github.com/likhonsheikhofficial
 */

// Store version history
let versionHistory = []
let currentRunId = null

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Update model badge
  updateModelBadge()

  // Set up event listeners
  document.getElementById("generate-btn").addEventListener("click", generateCode)
  document.getElementById("copy-btn").addEventListener("click", copyOutput)
  document.getElementById("feedback-btn").addEventListener("click", showFeedbackModal)

  // Close modal when clicking the close button
  document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("feedback-modal").style.display = "none"
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("feedback-modal")
    if (event.target === modal) {
      modal.style.display = "none"
    }
  })

  // Set up star rating in modal
  setupStarRating(document.querySelector(".modal-content .stars"))
  setupStarRating(document.getElementById("feedback-stars"))

  // Set up submit feedback button
  document.getElementById("submit-feedback-btn").addEventListener("click", submitFeedback)

  // Load version history
  loadVersions()
  // Check if screenshot file is selected and update UI
  const screenshotInput = document.getElementById("screenshot")
  screenshotInput.addEventListener("change", () => {
    const fileName = screenshotInput.files[0]?.name
    if (fileName) {
      const label = screenshotInput.previousElementSibling
      label.querySelector("span:last-child").textContent =
        fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName
    }
  })

  // Load version history if available
  //loadVersionHistory()
})

/**
 * Update the model badge with the current model
 */
function updateModelBadge() {
  fetch("/health")
    .then((response) => response.json())
    .then((data) => {
      const modelBadge = document.getElementById("model-badge")
      if (data.openai) {
        modelBadge.textContent = "Powered by OpenAI"
      } else if (data.together) {
        modelBadge.textContent = "Powered by Together AI"
      } else {
        modelBadge.textContent = "Powered by AI"
      }
    })
    .catch((error) => console.error("Error fetching health info:", error))
}

/**
 * Generate code based on prompt
 */
function generateCode() {
  const prompt = document.getElementById("prompt").value.trim()
  const promptType = document.getElementById("prompt-type").value
  const additionalContext = document.getElementById("additional-context")?.value.trim() || ""

  if (!prompt) {
    alert("Please enter a description of your idea")
    return
  }

  // Show loading indicator
  document.getElementById("loading").style.display = "flex"
  document.getElementById("output-section").style.display = "none"

  // Clear previous output
  document.getElementById("output").textContent = ""

  // Prepare request data
  const requestData = {
    prompt,
    prompt_type: promptType,
    additional_context: additionalContext,
  }

  // Send request
  fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      // Hide loading indicator
      document.getElementById("loading").style.display = "none"

      // Display the generated code
      document.getElementById("output").textContent = data.generated
      document.getElementById("output-section").style.display = "block"

      // Update LangSmith link
      currentRunId = data.run_id
      const langsmithLink = document.getElementById("langsmith-link")
      langsmithLink.href = `https://smith.langchain.com/runs/${currentRunId}`

      // Add to version history
      if (data.version) {
        addToVersionHistory(data.version)
      }
    })
    .catch((error) => {
      // Hide loading indicator
      document.getElementById("loading").style.display = "none"

      // Show error
      alert(`Error generating code: ${error.message}`)
    })
}

/**
 * Generate code based on text prompt
 */
async function generate() {
  const promptElement = document.getElementById("prompt")
  const prompt = promptElement.value.trim()

  if (!prompt) {
    showError("Please enter a description of your idea")
    return
  }

  // Show loading indicator
  const loadingElement = document.getElementById("loading")
  loadingElement.style.display = "flex"

  // Clear previous output
  document.getElementById("output").textContent = ""
  document.querySelector(".output-section").style.display = "none"

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Display the generated code
    const outputElement = document.getElementById("output")
    outputElement.textContent = data.generated
    document.querySelector(".output-section").style.display = "block"

    // Add to version history
    if (data.timestamp) {
      addToVersionHistory({
        id: data.timestamp,
        tag: `v${data.timestamp}`,
        prompt: prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""),
        date: new Date().toLocaleString(),
      })
    }
  } catch (error) {
    showError(`Error generating code: ${error.message}`)
  } finally {
    // Hide loading indicator
    loadingElement.style.display = "none"
  }
}

/**
 * Upload and process screenshot
 */
async function uploadScreenshot() {
  const fileInput = document.getElementById("screenshot")

  if (!fileInput.files || fileInput.files.length === 0) {
    showError("Please select an image file")
    return
  }

  const file = fileInput.files[0]

  // Validate file is an image
  if (!file.type.startsWith("image/")) {
    showError("Please select a valid image file")
    return
  }

  // Show loading indicator
  const loadingElement = document.getElementById("loading")
  loadingElement.style.display = "flex"

  // Clear previous output
  document.getElementById("output").textContent = ""
  document.querySelector(".output-section").style.display = "none"

  try {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch("/screenshot", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Display the generated image
    const outputElement = document.getElementById("output")
    outputElement.innerHTML = `<img src="data:image/png;base64,${data.image}" alt="Generated UI" style="max-width: 100%;">`
    document.querySelector(".output-section").style.display = "block"

    // Add to version history
    const timestamp = new Date().getTime().toString()
    addToVersionHistory({
      id: timestamp,
      tag: `v${timestamp}_screenshot`,
      prompt: `Screenshot: ${file.name}`,
      date: new Date().toLocaleString(),
    })
  } catch (error) {
    showError(`Error processing screenshot: ${error.message}`)
  } finally {
    // Hide loading indicator
    loadingElement.style.display = "none"
  }
}

/**
 * Restore a previous version
 */
async function restoreVersion(tag) {
  if (!confirm(`Are you sure you want to restore version ${tag}?`)) {
    return
  }

  // Show loading indicator
  const loadingElement = document.getElementById("loading")
  loadingElement.style.display = "flex"

  try {
    const response = await fetch("/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tag }),
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Show success message
    alert(`Successfully restored version ${tag}`)

    // Reload the page to show the restored version
    window.location.reload()
  } catch (error) {
    showError(`Error restoring version: ${error.message}`)
  } finally {
    // Hide loading indicator
    loadingElement.style.display = "none"
  }
}

/**
 * Copy output to clipboard
 */
function copyOutput() {
  const outputElement = document.getElementById("output")
  const text = outputElement.textContent

  navigator.clipboard
    .writeText(text)
    .then(() => {
      const copyBtn = document.getElementById("copy-btn")
      const originalText = copyBtn.textContent
      copyBtn.textContent = "Copied!"
      setTimeout(() => {
        copyBtn.textContent = originalText
      }, 2000)
    })
    .catch((err) => {
      alert(`Failed to copy: ${err}`)
    })
}

/**
 * Show feedback modal
 */
function showFeedbackModal() {
  if (!currentRunId) {
    alert("No code has been generated yet")
    return
  }

  // Reset stars
  const stars = document.querySelectorAll(".modal-content .star")
  stars.forEach((star) => star.classList.remove("active"))

  // Reset comment
  document.getElementById("feedback-comment").value = ""

  // Show modal
  document.getElementById("feedback-modal").style.display = "flex"
}

/**
 * Submit feedback to LangSmith
 */
function submitFeedback() {
  if (!currentRunId) {
    alert("No code has been generated yet")
    return
  }

  // Get rating
  const activeStars = document.querySelectorAll(".modal-content .star.active")
  const rating = activeStars.length

  if (rating === 0) {
    alert("Please provide a rating")
    return
  }

  // Get comment
  const comment = document.getElementById("feedback-comment").value

  // Prepare request data
  const requestData = {
    run_id: currentRunId,
    score: rating,
    comment,
  }

  // Send request
  fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      // Hide modal
      document.getElementById("feedback-modal").style.display = "none"

      // Show success message
      alert("Thank you for your feedback!")

      // Update stars in the main view
      updateMainViewStars(rating)
    })
    .catch((error) => {
      alert(`Error submitting feedback: ${error.message}`)
    })
}

/**
 * Update stars in the main view
 */
function updateMainViewStars(rating) {
  const stars = document.querySelectorAll("#feedback-stars .star")
  stars.forEach((star) => {
    const value = Number.parseInt(star.dataset.value)
    if (value <= rating) {
      star.classList.add("active")
    } else {
      star.classList.remove("active")
    }
  })
}

/**
 * Set up star rating functionality
 */
function setupStarRating(container) {
  if (!container) return

  const stars = container.querySelectorAll(".star")

  stars.forEach((star) => {
    // Hover effect
    star.addEventListener("mouseover", () => {
      const value = Number.parseInt(star.dataset.value)
      stars.forEach((s) => {
        const starValue = Number.parseInt(s.dataset.value)
        if (starValue <= value) {
          s.classList.add("hover")
        } else {
          s.classList.remove("hover")
        }
      })
    })

    // Remove hover effect
    container.addEventListener("mouseout", () => {
      stars.forEach((s) => s.classList.remove("hover"))
    })

    // Click event
    star.addEventListener("click", () => {
      const value = Number.parseInt(star.dataset.value)
      stars.forEach((s) => {
        const starValue = Number.parseInt(s.dataset.value)
        if (starValue <= value) {
          s.classList.add("active")
        } else {
          s.classList.remove("active")
        }
      })
    })
  })
}

/**
 * Add a version to the history
 */
function addToVersionHistory(version) {
  // Add to the beginning of the array
  versionHistory.unshift(version)

  // Render the updated history
  renderVersionHistory()
  versionHistory.unshift(version)

  // Save to localStorage
  localStorage.setItem("launchVersionHistory", JSON.stringify(versionHistory))

  // Update the UI
  renderVersionHistory()
}

/**
 * Load version history from localStorage
 */
function loadVersionHistory() {
  const saved = localStorage.getItem("launchVersionHistory")
  if (saved) {
    try {
      versionHistory = JSON.parse(saved)
      renderVersionHistory()
    } catch (e) {
      console.error("Failed to parse version history:", e)
    }
  }
}

/**
 * Load version history
 */
function loadVersions() {
  fetch("/api/versions")
    .then((response) => response.json())
    .then((data) => {
      if (data.versions && data.versions.length > 0) {
        versionHistory = data.versions
        renderVersionHistory()
      }
    })
    .catch((error) => console.error("Error loading versions:", error))
}

/**
 * Render the version history in the UI
 */
function renderVersionHistory() {
  const listElement = document.getElementById("version-list")

  if (versionHistory.length === 0) {
    listElement.innerHTML = '<li class="empty-history">No versions yet</li>'
    return
  }

  listElement.innerHTML = versionHistory
    .map(
      (version) => `
    <li>
      <div>
        <strong>${version.tag}</strong>
        <div>${version.prompt}</div>
        <small>${version.date}</small>
      </div>
      <button onclick="restoreVersion('${version.tag}')">Restore</button>
    </li>
  `,
    )
    .join("")
}

/**
 * Render the version history
 */
// function renderVersionHistory() {
//   const listElement = document.getElementById("version-list");

//   if (versionHistory.length === 0) {
//     listElement.innerHTML = '<li class="empty-history">No versions yet</li>';
//     return;
//   }

//   listElement.innerHTML = versionHistory
//     .map(version => `
//       <li>
//         <div class="version-info">
//           <strong>${version.tag}</strong>
//           <div class="version-prompt">${version.prompt}</div>
//           <div class="version-meta">
//             <span class="version-type">${version.prompt_type}</span>
//             <span class="version-date">${new Date(version.date).toLocaleString()}</span>
//           </div>
//         </div>
//         <div class="version-actions">
//           <button onclick="viewVersion('${version.timestamp}')" class="version-btn secondary-btn">View</button>
//         </div>
//       </li>
//     `)
//     .join("");
// }

/**
 * View a specific version
 */
function viewVersion(timestamp) {
  fetch(`/api/version/${timestamp}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      // Display the code
      document.getElementById("output").textContent = data.code
      document.getElementById("output-section").style.display = "block"

      // Update LangSmith link if available
      currentRunId = data.version.run_id
      if (currentRunId) {
        const langsmithLink = document.getElementById("langsmith-link")
        langsmithLink.href = `https://smith.langchain.com/runs/${currentRunId}`
      }

      // Scroll to output
      document.getElementById("output-section").scrollIntoView({ behavior: "smooth" })
    })
    .catch((error) => {
      alert(`Error viewing version: ${error.message}`)
    })
}

/**
 * Show error message
 */
function showError(message) {
  alert(message)
}

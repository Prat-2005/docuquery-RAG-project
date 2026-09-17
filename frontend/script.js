const API_BASE = "http://127.0.0.1:8000";
const currentPage = document.body.dataset.page;

// Guard: redirect upload.html and query.html to index.html if accessed directly
if (currentPage === "upload" || currentPage === "query") {
  const isFromApp = sessionStorage.getItem("docuqueryStarted");
  if (!isFromApp) {
    window.location.href = "index.html";
  }
}

// Mark session as started when visiting home page
if (currentPage === "home") {
  sessionStorage.setItem("docuqueryStarted", "true");
}

const statusOverlay = document.querySelector("#status-overlay");
const statusDialog = document.querySelector("#status-dialog");
const statusSymbol = document.querySelector("#status-symbol");
const statusTitle = document.querySelector("#status-title");
const statusMessage = document.querySelector("#status-message");
const statusClose = document.querySelector("#status-close");
let statusTimer;

const apiEndpoint = document.querySelector("#api-endpoint");
if (apiEndpoint) {
  apiEndpoint.textContent = API_BASE;
}

if (statusClose) {
  statusClose.addEventListener("click", closeStatus);
}

if (statusOverlay) {
  statusOverlay.addEventListener("click", (event) => {
    if (event.target === statusOverlay) closeStatus();
  });
}

if (currentPage === "upload") {
  setupUploadPage();
} else if (currentPage === "query") {
  setupQueryPage();
}

function setupUploadPage() {
  const fileInput = document.querySelector("#document-input");
  const uploadZone = document.querySelector(".upload-zone");
  const removeFile = document.querySelector("#remove-file");
  const fileCard = document.querySelector("#file-card");
  const uploadStatus = document.querySelector("#upload-status");

  if (!fileInput || !uploadZone || !removeFile || !fileCard) return;

  fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));

  removeFile.addEventListener("click", () => {
    fileInput.value = "";
    fileCard.classList.add("is-hidden");
    const summary = document.querySelector("#file-summary");
    if (summary) summary.classList.add("is-hidden");
    if (uploadStatus) {
      uploadStatus.textContent = "Your document will upload automatically after selection.";
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("dragover");
    });
  });

  uploadZone.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));

  function selectFile(file) {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "txt"].includes(extension)) {
      showStatus("error", "Upload failed", "Please choose a PDF, DOCX, or TXT file.");
      return;
    }

    const fileName = document.querySelector("#file-name");
    const fileMeta = document.querySelector("#file-meta");
    const fileType = document.querySelector("#file-type");

    if (fileName) fileName.textContent = file.name;
    if (fileMeta) fileMeta.textContent = `${formatBytes(file.size)} · Uploading...`;
    if (fileType) fileType.textContent = extension.toUpperCase();

    fileCard.classList.remove("is-hidden");
    uploadDocument(file);
  }
}

async function uploadDocument(file) {
  const uploadStatus = document.querySelector("#upload-status");
  const formData = new FormData();
  formData.append("file", file);

  if (uploadStatus) uploadStatus.textContent = "Uploading document...";

  try {
    const data = await postForm("/upload", formData);
    const uploadedInfo = {
      filename: data.filename || file.name,
      size: file.size,
      extension: file.name.split(".").pop().toUpperCase(),
    };

    sessionStorage.setItem("docuqueryFile", JSON.stringify(uploadedInfo));
    sessionStorage.removeItem("docuqueryMessages");

    if (uploadStatus) {
      uploadStatus.textContent = `${data.chunk_count} passages indexed.`;
    }

    showFileSummary({
      summary: data.summary || "The document was indexed, but no content summary was returned.",
    });

    showStatus("success", "Upload complete", "Your document is ready. Read the summary, then continue when you are ready.");
    const continueButton = document.querySelector("#continue-button");
    if (continueButton) continueButton.classList.remove("is-hidden");
  } catch (error) {
    if (uploadStatus) {
      uploadStatus.textContent = "Upload failed.";
    }
    showStatus("error", "Upload failed", error.message);
  }
}

function setupQueryPage() {
  const fileInfo = JSON.parse(sessionStorage.getItem("docuqueryFile") || "null");
  const questionForm = document.querySelector("#question-form");
  const questionInput = document.querySelector("#question");
  const regenerateButton = document.querySelector("#regenerate-button");
  const copyAnswerButton = document.querySelector("#copy-answer");
  const stopButton = document.querySelector("#stop-button");
  const chatThread = document.querySelector("#chat-thread");
  const emptyState = document.querySelector("#empty-state");
  const loadingState = document.querySelector("#loading-state");

  if (!fileInfo) {
    window.location.href = "upload.html";
    return;
  }

  if (!questionForm || !questionInput || !chatThread || !emptyState || !loadingState) return;

  const fileName = document.querySelector("#file-name");
  const fileMeta = document.querySelector("#file-meta");
  const fileType = document.querySelector("#file-type");

  if (fileName) fileName.textContent = fileInfo.filename;
  if (fileMeta) fileMeta.textContent = `${formatBytes(fileInfo.size)} · Ready for questions`;
  if (fileType) fileType.textContent = fileInfo.extension;

  const state = {
    messages: loadMessages(),
    activeRequest: null,
    editingIndex: null,
  };

  questionForm.addEventListener("submit", askQuestion);
  questionInput.addEventListener("keydown", handleQuestionKeydown);

  if (regenerateButton) regenerateButton.addEventListener("click", regenerateAnswer);
  if (copyAnswerButton) {
    copyAnswerButton.addEventListener("click", () => {
      const answer = getLatestAnswerText();
      if (answer) copyText(answer, "Answer copied");
    });
  }
  if (stopButton) stopButton.addEventListener("click", stopRequest);

  renderMessages();

  async function askQuestion(event) {
    event.preventDefault();
    const question = questionInput.value.trim();
    if (!question) {
      showStatus("error", "Question required", "Write a question before asking the document.");
      return;
    }

    const editingIndex = state.editingIndex;
    state.editingIndex = null;
    questionInput.value = "";

    if (editingIndex !== null && state.messages[editingIndex]?.role === "user") {
      state.messages = state.messages.slice(0, editingIndex + 1);
      state.messages[editingIndex].text = question;
    } else {
      state.messages.push({ role: "user", text: question });
    }

    state.messages.push({
      role: "assistant",
      text: "",
      context: "",
      revisions: [{ text: "", context: "" }],
      revisionIndex: 0,
      pending: true,
    });

    renderMessages();
    setLoading(true);
    state.activeRequest = new AbortController();

    try {
      const latestAnswer = getLatestAnswerText();
      const data = await postJson("/generate", { question, improv_answer: latestAnswer }, state.activeRequest.signal);
      const answerText = data.answer || "No answer was returned.";
      const answerContext = data.context || "";
      const lastAssistant = getLatestAssistantMessage();

      if (lastAssistant && lastAssistant.pending) {
        lastAssistant.text = answerText;
        lastAssistant.context = answerContext;
        lastAssistant.revisions = [{ text: answerText, context: answerContext }];
        lastAssistant.revisionIndex = 0;
        lastAssistant.pending = false;
      } else {
        state.messages.push({
          role: "assistant",
          text: answerText,
          context: answerContext,
          revisions: [{ text: answerText, context: answerContext }],
          revisionIndex: 0,
          pending: false,
        });
      }

      renderMessages();
    } catch (error) {
      const pendingAssistant = getLatestAssistantMessage();
      if (pendingAssistant && pendingAssistant.pending) {
        state.messages = state.messages.filter((entry) => entry !== pendingAssistant);
      }
      if (error.name !== "AbortError") {
        showStatus("error", "Question failed", error.message);
      }
    } finally {
      state.activeRequest = null;
      setLoading(false);
      renderMessages();
    }
  }

  async function regenerateAnswer() {
    const latestUser = getLatestUserMessage();
    const latestAssistant = getLatestAssistantMessage();

    if (!latestUser || !latestAssistant) {
      showStatus("error", "Nothing to regenerate", "Ask a question before regenerating an answer.");
      return;
    }

    const previousAnswer = getVisibleAssistantValue(latestAssistant);
    const previousRevisions = Array.isArray(latestAssistant.revisions)
      ? [...latestAssistant.revisions]
      : [{ text: previousAnswer.text, context: previousAnswer.context }];
    latestAssistant.pending = true;
    latestAssistant.text = previousAnswer.text;
    latestAssistant.context = previousAnswer.context;
    latestAssistant.revisions = previousRevisions;

    renderMessages();
    setLoading(true);
    state.activeRequest = new AbortController();

    try {
      const data = await postJson("/regenerate", { question: latestUser.text, improv_answer: previousAnswer.text }, state.activeRequest.signal);
      const answerText = data.answer || previousAnswer.text || "No answer was returned.";
      const answerContext = data.context || previousAnswer.context || "";
      const revisions = [...previousRevisions];

      revisions.push({ text: answerText, context: answerContext });
      latestAssistant.text = answerText;
      latestAssistant.context = answerContext;
      latestAssistant.revisions = revisions;
      latestAssistant.revisionIndex = revisions.length - 1;
      latestAssistant.pending = false;

      renderMessages();
    } catch (error) {
      latestAssistant.pending = false;
      latestAssistant.text = previousAnswer.text;
      latestAssistant.context = previousAnswer.context;
      latestAssistant.revisions = previousRevisions;
      latestAssistant.revisionIndex = Math.max(0, previousRevisions.length - 1);
      if (error.name !== "AbortError") {
        showStatus("error", "Regeneration failed", error.message);
      }
    } finally {
      state.activeRequest = null;
      setLoading(false);
      renderMessages();
    }
  }

  function stopRequest() {
    if (!state.activeRequest) return;
    state.activeRequest.abort();

    const pendingAssistant = getLatestAssistantMessage();
    if (pendingAssistant && pendingAssistant.pending) {
      if (pendingAssistant.text) {
        pendingAssistant.pending = false;
      } else {
        state.messages = state.messages.filter((entry) => entry !== pendingAssistant);
      }
    }

    setLoading(false);
    renderMessages();
    showStatus("success", "Request stopped", "The current request was cancelled.");
  }

  function renderMessages() {
    saveMessages();
    chatThread.innerHTML = "";

    if (state.messages.length === 0) {
      chatThread.appendChild(emptyState);
      emptyState.classList.remove("is-hidden");
      loadingState.classList.add("is-hidden");
      return;
    }

    emptyState.classList.add("is-hidden");

    state.messages.forEach((entry) => {
      const messageGroup = document.createElement("div");
      messageGroup.className = `message-group ${entry.role}-message`;

      const visibleEntry = getVisibleAssistantValue(entry);
      const bubble = document.createElement("div");
      bubble.className = `chat-bubble ${entry.role}-bubble${entry.pending ? " pending-bubble" : ""}`;
      bubble.textContent = entry.role === "assistant"
        ? (entry.pending ? "Generating response..." : (visibleEntry.text || "…"))
        : entry.text;

      if (entry.pending) {
        const pendingDot = document.createElement("span");
        pendingDot.className = "pending-dot";
        bubble.prepend(pendingDot);
        bubble.appendChild(document.createTextNode(""));
      }

      messageGroup.appendChild(bubble);

      if (entry.role === "assistant" && entry.revisions && entry.revisions.length > 1) {
        const revisionMeta = document.createElement("div");
        revisionMeta.className = "message-meta";
        revisionMeta.textContent = `${(entry.revisionIndex ?? 0) + 1} / ${entry.revisions.length}`;
        messageGroup.appendChild(revisionMeta);
      }

      if (entry.role === "user") {
        const actions = document.createElement("div");
        actions.className = "message-actions";
        actions.innerHTML = '<button class="message-action" type="button">▣ <span>Copy</span></button><button class="message-action" type="button">✎ <span>Edit</span></button>';

        actions.children[0].addEventListener("click", () => copyText(entry.text, "Question copied"));
        actions.children[1].addEventListener("click", () => {
          state.editingIndex = state.messages.indexOf(entry);
          questionInput.value = entry.text;
          questionInput.focus();
        });

        messageGroup.appendChild(actions);
      }

      if (entry.role === "assistant") {
        const actions = document.createElement("div");
        actions.className = "message-actions";

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "message-action";
        copyButton.innerHTML = "▣ <span>Copy</span>";
        copyButton.addEventListener("click", () => copyText(visibleEntry.text, "Answer copied"));

        const regenerateButtonItem = document.createElement("button");
        regenerateButtonItem.type = "button";
        regenerateButtonItem.className = "message-action";
        regenerateButtonItem.innerHTML = "↻ <span>Regenerate</span>";
        regenerateButtonItem.addEventListener("click", regenerateAnswer);

        if (entry.revisions && entry.revisions.length > 1) {
          const prevButton = document.createElement("button");
          prevButton.type = "button";
          prevButton.className = "message-action";
          prevButton.innerHTML = "<span><</span>";
          prevButton.disabled = (entry.revisionIndex ?? 0) === 0;
          prevButton.addEventListener("click", () => {
            entry.revisionIndex = Math.max(0, (entry.revisionIndex ?? 0) - 1);
            renderMessages();
          });

          const nextButton = document.createElement("button");
          nextButton.type = "button";
          nextButton.className = "message-action";
          nextButton.innerHTML = "<span>></span>";
          nextButton.disabled = (entry.revisionIndex ?? 0) >= entry.revisions.length - 1;
          nextButton.addEventListener("click", () => {
            entry.revisionIndex = Math.min(entry.revisions.length - 1, (entry.revisionIndex ?? 0) + 1);
            renderMessages();
          });

          actions.append(copyButton, prevButton, nextButton, regenerateButtonItem);
        } else if (!entry.pending) {
          actions.append(copyButton, regenerateButtonItem);
        }

        if (!entry.pending) messageGroup.appendChild(actions);
      }

      chatThread.appendChild(messageGroup);
    });

    if (state.activeRequest) {
      loadingState.classList.remove("is-hidden");
    } else {
      loadingState.classList.add("is-hidden");
    }
  }

  function loadMessages() {
    try {
      const savedMessages = JSON.parse(sessionStorage.getItem("docuqueryMessages") || "[]");
      return Array.isArray(savedMessages)
        ? savedMessages.filter((entry) => entry && !entry.pending)
        : [];
    } catch {
      return [];
    }
  }

  function saveMessages() {
    const completedMessages = state.messages.filter((entry) => entry && !entry.pending);
    sessionStorage.setItem("docuqueryMessages", JSON.stringify(completedMessages));
  }

  function getVisibleAssistantValue(entry) {
    if (!entry || entry.role !== "assistant") return { text: "", context: "" };
    if (!Array.isArray(entry.revisions) || entry.revisions.length === 0) {
      return { text: entry.text || "", context: entry.context || "" };
    }

    const index = Math.max(0, Math.min((entry.revisionIndex ?? 0), entry.revisions.length - 1));
    return entry.revisions[index] || { text: entry.text || "", context: entry.context || "" };
  }

  function getLatestUserMessage() {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      if (state.messages[index].role === "user") return state.messages[index];
    }
    return null;
  }

  function getLatestAssistantMessage() {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      if (state.messages[index].role === "assistant") return state.messages[index];
    }
    return null;
  }

  function getLatestAnswerText() {
    const latestAssistant = getLatestAssistantMessage();
    if (!latestAssistant) return "";
    return getVisibleAssistantValue(latestAssistant).text || "";
  }
}

function handleQuestionKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  event.currentTarget.form.requestSubmit();
}

async function postJson(path, body, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return readResponse(response);
}

async function postForm(path, body) {
  const response = await fetch(`${API_BASE}${path}`, { method: "POST", body });
  return readResponse(response);
}

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Something went wrong. Is the API running?");
  return data;
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showStatus("success", message, "The text is now on your clipboard.");
  } catch {
    showStatus("error", "Copy failed", "Your browser did not allow clipboard access.");
  }
}

function setLoading(isLoading) {
  const emptyState = document.querySelector("#empty-state");
  const loadingState = document.querySelector("#loading-state");
  const stopButton = document.querySelector("#stop-button");
  const askButton = document.querySelector("#ask-button");
  const chatThread = document.querySelector("#chat-thread");
  const answerCard = document.querySelector("#answer-card");

  if (emptyState) {
    emptyState.classList.toggle("is-hidden", isLoading || (chatThread && chatThread.children.length > 0));
  }
  if (loadingState) loadingState.classList.toggle("is-hidden", !isLoading);
  if (stopButton) stopButton.classList.toggle("is-hidden", !isLoading);
  if (askButton) askButton.disabled = isLoading;
  if (answerCard) answerCard.setAttribute("aria-busy", String(isLoading));
}

function showStatus(type, title, message) {
  const statusDialogElement = document.querySelector("#status-dialog");
  const statusSymbolElement = document.querySelector("#status-symbol");
  const statusTitleElement = document.querySelector("#status-title");
  const statusMessageElement = document.querySelector("#status-message");
  const statusOverlayElement = document.querySelector("#status-overlay");

  clearTimeout(statusTimer);
  if (statusDialogElement) statusDialogElement.className = `status-dialog ${type}`;
  if (statusSymbolElement) statusSymbolElement.textContent = type === "success" ? "✓" : "!";
  if (statusTitleElement) statusTitleElement.textContent = title;
  if (statusMessageElement) statusMessageElement.textContent = message;
  if (statusOverlayElement) statusOverlayElement.classList.remove("is-hidden");

  statusTimer = setTimeout(closeStatus, type === "success" ? 2200 : 5200);
}

function closeStatus() {
  const statusOverlayElement = document.querySelector("#status-overlay");
  if (statusOverlayElement) statusOverlayElement.classList.add("is-hidden");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function showFileSummary({ summary: contentSummary }) {
  const summary = document.querySelector("#file-summary");
  const summaryText = document.querySelector("#file-summary-text");
  if (!summary || !summaryText) return;

  summaryText.textContent = contentSummary || "No content summary was returned.";
  summary.classList.remove("is-hidden");
}

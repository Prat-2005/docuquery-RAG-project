import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  FileText,
  Loader2,
  Menu,
  MessageSquare,
  Sparkles,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Plus,
  RefreshCw
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { docService } from '../services/docService';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import DocumentWorkspace from '../components/documents/DocumentWorkspace';
import MarkdownRenderer from '../components/chat/MarkdownRenderer';

const getErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(' ');
  return detail || fallback;
};

const SUGGESTED_PROMPTS = [
  'Summarize the key findings and main takeaways.',
  'What are the core conclusions and recommendations?',
  'Explain any methodologies, data, or evidence referenced.',
];

const ChatPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState('');
  const [draft, setDraft] = useState('');

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);

  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDocPanelOpen, setIsDocPanelOpen] = useState(true);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const quickFileInputRef = useRef(null);
  const sendControllerRef = useRef(null);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // 1. Initial load of conversations
  useEffect(() => {
    let active = true;
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        if (!active) return;
        setConversations(data);

        // Check if coming from landing page with initial files
        const initialFiles = location.state?.initialFiles;
        if (initialFiles && initialFiles.length > 0) {
          // Clean history state so reload doesn't trigger again
          navigate('/app', { replace: true, state: {} });
          await handleInitialFilesUpload(initialFiles);
        } else if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load conversations.'));
      } finally {
        if (active) setIsLoadingConversations(false);
      }
    };

    loadConversations();
    return () => {
      active = false;
    };
  }, []);

  // Handler for files uploaded from Landing Page
  const handleInitialFilesUpload = async (files) => {
    setError('');
    setIsUploading(true);
    try {
      const title = files[0]?.name ? `Doc: ${files[0].name.slice(0, 30)}` : 'New Conversation';
      const newConv = await chatService.createConversation({ title });
      setConversations((current) => [newConv, ...current]);
      setSelectedId(newConv.id);

      await docService.uploadDocuments(newConv.id, files);
      await loadConversationDocsAndSummary(newConv.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to upload document from landing page.'));
    } finally {
      setIsUploading(false);
    }
  };

  // 2. When selectedId changes, load messages, documents, and summary
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setDocuments([]);
      setSelectedDocumentId(null);
      setSummary('');
      return;
    }

    let active = true;
    setIsLoadingMessages(true);
    setError('');

    // Fetch messages
    chatService
      .getMessages(selectedId)
      .then((data) => {
        if (active) setMessages(data || []);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError, 'Unable to load this conversation.'));
      })
      .finally(() => {
        if (active) setIsLoadingMessages(false);
      });

    // Fetch documents and summary
    loadConversationDocsAndSummary(selectedId);

    return () => {
      active = false;
    };
  }, [selectedId]);

  const loadConversationDocsAndSummary = async (conversationId) => {
    setIsLoadingDocuments(true);
    setIsLoadingSummary(true);
    setUploadError('');

    try {
      const docs = await docService.getConversationDocuments(conversationId);
      setDocuments(docs || []);
      setSelectedDocumentId((current) =>
        docs?.some((document) => document.id === current) ? current : docs?.[0]?.id || null,
      );
    } catch (err) {
      // Endpoint may return 404 if no documents yet
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }

    try {
      const summaryData = await chatService.getConversationSummary(conversationId);
      setSummary(summaryData?.summary || '');
    } catch (err) {
      setSummary('');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Create conversation
  const handleCreateConversation = async () => {
    setError('');
    try {
      const conversation = await chatService.createConversation({ title: 'New Conversation' });
      setConversations((current) => [conversation, ...current]);
      setSelectedId(conversation.id);
      setMessages([]);
      setDocuments([]);
      setSummary('');
      setIsSidebarOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create a conversation.'));
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedId === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete conversation.'));
    }
  };

  // Upload documents to current conversation
  const handleUploadDocuments = async (files) => {
    if (!selectedId) {
      // If no conversation yet, create one first
      try {
        const newConv = await chatService.createConversation({
          title: files[0]?.name ? `Doc: ${files[0].name.slice(0, 30)}` : 'New Conversation',
        });
        setConversations((current) => [newConv, ...current]);
        setSelectedId(newConv.id);
        await performUpload(newConv.id, files);
      } catch (err) {
        setUploadError(getErrorMessage(err, 'Failed to initialize conversation for upload.'));
      }
      return;
    }

    await performUpload(selectedId, files);
  };

  const performUpload = async (conversationId, files) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    try {
      await docService.uploadDocuments(conversationId, files, (progressEvent) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        }
      });
      setUploadProgress(100);
      await loadConversationDocsAndSummary(conversationId);
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Failed to process document.'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId) => {
    try {
      await docService.deleteDocument(documentId);
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
      }
      if (selectedId) {
        await loadConversationDocsAndSummary(selectedId);
      }
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Failed to delete document.'));
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || draft).trim();
    if (!content || !selectedId || isSending) return;

    if (documents.length === 0) {
      setError('Please upload at least one document first so DocuQuery AI can retrieve context and answer accurately.');
      return;
    }

    setDraft('');
    setError('');
    setIsSending(true);
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    sendControllerRef.current = { controller, conversationId: selectedId, requestId };
    const optimisticUserMessage = {
      id: `pending-user-${Date.now()}`,
      conversation_id: selectedId,
      role: 'user',
      content,
      created_id: new Date().toISOString(),
      optimistic: true,
    };
    const pendingAssistantMessage = {
      id: `pending-assistant-${Date.now()}`,
      conversation_id: selectedId,
      role: 'assistant',
      content: '',
      created_id: new Date().toISOString(),
      pending: true,
    };
    setMessages((current) => [...current, optimisticUserMessage, pendingAssistantMessage]);

    try {
      const response = await chatService.sendMessage(
        selectedId,
        { content },
        controller.signal,
        requestId,
      );
      if (controller.signal.aborted) {
        throw new DOMException('Message generation was cancelled', 'AbortError');
      }
      setMessages((current) => {
        const withoutPending = current.filter(
          (message) =>
            message.id !== optimisticUserMessage.id &&
            message.id !== pendingAssistantMessage.id,
        );
        return [...withoutPending, response.user_message, response.assistant_message];
      });

      // Refresh conversations list to update title and order
      const refreshed = await chatService.getConversations();
      setConversations(refreshed);
    } catch (requestError) {
      if (controller.signal.aborted) {
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingAssistantMessage.id
              ? { ...message, pending: false, stopped: true, content: 'Generation stopped.' }
              : message,
          ),
        );
      } else {
        setDraft(content);
        setMessages((current) =>
          current.filter(
            (message) =>
              message.id !== optimisticUserMessage.id &&
              message.id !== pendingAssistantMessage.id,
          ),
        );
        setError(getErrorMessage(requestError, 'Unable to send your message.'));
      }
    } finally {
      if (sendControllerRef.current?.controller === controller) {
        sendControllerRef.current = null;
      }
      setIsSending(false);
      chatInputRef.current?.focus();
    }
  };

  const handleStopGeneration = () => {
    const requestId = sendControllerRef.current?.requestId;
    const conversationId = sendControllerRef.current?.conversationId;
    if (!requestId || !conversationId) return;
    const activeRequest = sendControllerRef.current;
    activeRequest.controller.abort();
    chatService
      .stopMessage(conversationId, requestId)
      .then((result) => {
        if (!result.cancelled) {
          setError('Generation had already completed before it could be stopped.');
        }
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError, 'Unable to stop message generation.'));
      });
  };

  const handleRegenerateMessage = async (message, messageIndex) => {
    if (!selectedId || regeneratingId || isSending) return;
    const previousMessage = messages[messageIndex - 1];
    if (!previousMessage || previousMessage.role !== 'user') {
      setError('The question for this answer could not be found.');
      return;
    }

    setError('');
    setRegeneratingId(message.id);
    try {
      const response = await chatService.regenerateAnswer(
        selectedId,
        previousMessage.content,
        message.content,
      );
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, content: response.answer }
            : item,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to regenerate this answer.'));
    } finally {
      setRegeneratingId(null);
    }
  };

  // Copy assistant response
  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* 1. Left Sidebar: Conversation Management */}
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        search={search}
        onSearchChange={setSearch}
        onSelectConversation={setSelectedId}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isLoadingConversations}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Center Panel: Chat Interface */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/50">
        {/* Workspace Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900">
                {selectedConversation?.title || 'DocuQuery AI Workspace'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>RAG Chat</span>
                <span>•</span>
                {documents.length > 0 ? (
                  <span className="text-emerald-600 font-medium">
                    {documents.length} {documents.length === 1 ? 'document' : 'documents'} ready
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">No documents attached</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDocPanelOpen(!isDocPanelOpen)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isDocPanelOpen
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle Document Workspace"
            >
              {isDocPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Documents</span>
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                {documents.length}
              </span>
            </button>
          </div>
        </header>

        {/* Chat Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {!selectedConversation ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-indigo-100 p-4 text-indigo-600 shadow-xs">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome to DocuQuery AI</h2>
              <p className="mt-2 text-sm text-slate-500">
                Select an existing conversation from the sidebar or start a new one to begin querying your documents.
              </p>
              <button
                type="button"
                onClick={handleCreateConversation}
                className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create your first conversation
              </button>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex h-full items-center justify-center text-indigo-600">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-xs font-medium text-slate-500">Loading conversation...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            /* Empty State: No Documents Attached */
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-indigo-600">
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Add documents to get started</h2>
              <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
                DocuQuery AI answers questions strictly grounded in your files. Upload your PDF, DOCX, or TXT documents below or in the right panel.
              </p>

              <div className="mt-6 w-full max-w-md">
                <input
                  type="file"
                  ref={quickFileInputRef}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleUploadDocuments(files);
                  }}
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-indigo-300 bg-white p-6 text-sm font-semibold text-indigo-600 shadow-xs transition hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Indexing your document...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Click to upload documents (PDF, DOCX, TXT)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State: Documents uploaded, ready to chat */
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">This conversation is ready</h2>
              <p className="mt-1 text-xs text-slate-500">
                {documents.length} document{documents.length > 1 ? 's' : ''} indexed. Ask any question below or try a prompt:
              </p>

              {/* Prompt Suggestions */}
              <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-3">
                {SUGGESTED_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left text-xs text-slate-700 shadow-2xs transition hover:border-indigo-400 hover:bg-indigo-50/20 hover:text-indigo-900"
                  >
                    <span>{promptText}</span>
                    <span className="mt-3 text-[11px] font-semibold text-indigo-600">Ask this →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Message List */
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message, messageIndex) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[85%] sm:max-w-[78%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'rounded-tr-none bg-indigo-600 text-white'
                          : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : message.pending ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          <span>Searching documents and generating an answer...</span>
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}

                      {!isUser && !message.pending && (
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                          <span>Grounded by DocuQuery AI</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRegenerateMessage(message, messageIndex)}
                              disabled={Boolean(regeneratingId) || isSending}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Regenerate answer"
                            >
                              <RefreshCw className={`h-3 w-3 ${regeneratingId === message.id ? 'animate-spin' : ''}`} />
                              <span>{regeneratingId === message.id ? 'Regenerating...' : 'Regenerate'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Copy response"
                            >
                              {copiedId === message.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 uppercase">
                        {user?.email ? user.email.slice(0, 2) : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-xs font-semibold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
            >
              {/* Paperclip quick attach */}
              <input
                type="file"
                id="chat-file-input"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) handleUploadDocuments(files);
                }}
                multiple
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <label
                htmlFor="chat-file-input"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                title="Attach document to this conversation"
              >
                <Paperclip className="h-5 w-5" />
              </label>

              <textarea
                ref={chatInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!selectedConversation || isSending}
                rows={1}
                placeholder={
                  !selectedConversation
                    ? 'Create a conversation to start chatting'
                    : documents.length === 0
                    ? 'Upload a document first, then ask questions...'
                    : 'Ask a question about your documents...'
                }
                className="max-h-36 min-h-[40px] flex-1 resize-y bg-transparent py-2 px-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />

              <button
                type={isSending ? 'button' : 'submit'}
                onClick={isSending ? handleStopGeneration : undefined}
                disabled={!isSending && (!selectedConversation || !draft.trim())}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition ${
                  isSending
                    ? 'bg-slate-700 hover:bg-slate-900'
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400'
                }`}
                aria-label={isSending ? 'Stop generating response' : 'Send message'}
                title={isSending ? 'Stop generating response' : 'Send message'}
              >
                {isSending ? (
                  <span className="text-base leading-none" aria-hidden="true">▢</span>
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </form>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              Press Enter to send · Shift + Enter for a new line · Powered by RAG
            </p>
          </div>
        </div>
      </main>

      {/* 3. Right Panel: Document Workspace */}
      {isDocPanelOpen && (
        <DocumentWorkspace
          conversationId={selectedId}
          documents={documents}
          summary={summary}
          isLoadingSummary={isLoadingSummary}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
          uploadError={uploadError}
          onUpload={handleUploadDocuments}
          onDeleteDocument={handleDeleteDocument}
          onRefreshSummary={() => selectedId && loadConversationDocsAndSummary(selectedId)}
          onClose={() => setIsDocPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;

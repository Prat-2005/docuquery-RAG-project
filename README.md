# DocuQuery

DocuQuery is an AI-powered document intelligence and question-answering platform built on a Retrieval-Augmented Generation (RAG) architecture. Upload documents (`.pdf`, `.docx`, `.txt`), extract and index semantic chunks into a vector database, and engage in multi-turn conversations grounded in your documents with full context awareness and persistent history.

---

## Glimpse of the Application

Here is a visual walkthrough of DocuQuery's modern interface:

### 1. Landing Page & Hero Section
Modern landing page with intuitive navigation, theme switching, and quick access to document querying.
<p align="center">
  <img src="design/glimpse/landing_page_1.png" alt="DocuQuery Landing Page" width="850" />
</p>

### 2. Core Features & Capabilities
Highlighting multi-format uploads, intelligent chunking, vector embeddings, and persistent conversational history.
<p align="center">
  <img src="design/glimpse/landing_page_2.png" alt="Core Features" width="850" />
</p>

### 3. Architecture & System Metrics
Overview of DocuQuery's architecture featuring 384-dimensional vector embeddings, pgvector retrieval, and asynchronous APIs.
<p align="center">
  <img src="design/glimpse/landing_page_3.png" alt="Built with Purpose" width="850" />
</p>

### 4. Authentication & Social Sign-In
Secure user authentication with email/password (Argon2 hashing) and one-click Google OAuth sign-in.
<p align="center">
  <img src="design/glimpse/login_page.png" alt="Login & Authentication" width="850" />
</p>

### 5. RAG Studio & Document Q&A Workspace
Interactive chat workspace featuring multi-document management, conversation sidebar, markdown synthesis, and document context indicator.
<p align="center">
  <img src="design/glimpse/chatroom_page.png" alt="RAG Studio Chat Interface" width="850" />
</p>

### 6. User Profile & Settings Management
User settings panel for updating profile details, passwords, and custom LLM/retrieval parameters.
<p align="center">
  <img src="design/glimpse/settings_page.png" alt="User Settings Page" width="850" />
</p>

---

## Features

- **Multi-Format Ingestion**: Upload, extract, and index `.pdf` (PyMuPDF), `.docx` (python-docx), and `.txt` files.
- **Intelligent Text Chunking**: Configurable semantic chunking with overlap to preserve critical context across boundaries.
- **Vector Search with pgvector & FAISS**: Generate 384-dimensional dense embeddings stored and queried with PostgreSQL `pgvector` and FAISS for fast similarity retrieval.
- **Context-Aware AI Generation**: Answers generated using local OpenAI-compatible LLMs (Ollama, LM Studio) or custom endpoints, minimizing hallucinations.
- **Multi-Stage Summarization**: Hierarchical, chunk-based summarization for long and complex documents.
- **Persistent Conversation Management**: Multi-turn chat sessions saved to PostgreSQL with message regeneration, conversation renaming, search, and deletion.
- **Multi-Document Attachments**: Link single or multiple documents directly to specific conversations.
- **Authentication & Security**:
  - JWT-based authentication with Argon2 password hashing.
  - Email verification and password reset workflows with transactional SMTP email templates.
  - Google OAuth 2.0 integration.
- **Modern Responsive Frontend**:
  - React 18 SPA powered by Vite and Tailwind CSS.
  - Smooth animations with Framer Motion and icons from Lucide React.
  - Light and dark theme toggle.
  - Markdown rendering with code syntax formatting.

---

## Tech Stack

- **Backend**: FastAPI, Python 3.10+, SQLAlchemy 2.0, Alembic, PostgreSQL with `pgvector`, FAISS-CPU, PyMuPDF (`fitz`), python-docx, Pwdlib (Argon2), Authlib, Pydantic.
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, Axios, React Router DOM.
- **AI & Retrieval**: Local OpenAI-compatible server (Ollama, LM Studio) or external LLM API, local / Jina vector embeddings, SQLite embedding cache.

---

## Getting Started

### Prerequisites

- **Python**: Version 3.10 or newer
- **Node.js**: Version 18 or newer (with npm)
- **Database**: PostgreSQL 14+ with the `pgvector` extension installed
- **LLM Server**: A running OpenAI-compatible local model server (such as [Ollama](https://ollama.ai/) or [LM Studio](https://lmstudio.ai/))

---

### 1. Database Setup

Ensure PostgreSQL is running and the database exists. Connect to PostgreSQL and enable the `vector` extension:

```sql
CREATE DATABASE docuquery;
\c docuquery;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 2. Backend Setup

1. **Create and activate a virtual environment:**

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install backend dependencies:**

   ```powershell
   pip install -r requirement.txt
   ```

3. **Configure environment variables:**

   Copy the example environment file and update the values:

   ```powershell
   Copy-Item .env.example .env
   ```

4. **Apply database migrations:**

   ```powershell
   alembic upgrade head
   ```

5. **Start the FastAPI backend server:**

   ```powershell
   python -m uvicorn backend.main:app --reload --port 8000
   ```

   The backend API will be available at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

1. **Navigate to the frontend directory:**

   ```powershell
   cd frontend
   ```

2. **Install frontend dependencies:**

   ```powershell
   npm install
   ```

3. **Start the Vite development server:**

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser to use DocuQuery.

---

## Environment Variables

Configure these settings in your `.env` file:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string with psycopg (e.g. `postgresql+psycopg://user:password@localhost:5432/docuquery`). |
| `SESSION_SECRET` | Secret key used for session signing and middleware security. |
| `JWT_SECRET_KEY` | Secret key used for signing JWT authentication tokens. |
| `LLM_PROVIDER` | LLM backend type, default `local`. |
| `LLM_URL` | Base URL for OpenAI-compatible LLM endpoint (e.g. `http://localhost:11434`). |
| `LLM_MODEL` | Name of the chat model (e.g. `llama3`, `mistral`, `qwen2.5`). |
| `LLM_API_KEY` | Optional API key for LLM servers requiring authentication. |
| `EMBEDDING_PROVIDER` | `local` (default) or `jina`. |
| `LOCAL_EMBEDDING_MODEL` | Local embedding model name when using the local provider. |
| `EMBEDDING_CACHE_PATH` | Path to the SQLite embedding cache (`.cache/embedding_cache.sqlite3`). |
| `JINA_EMBEDDING_MODEL` | Jina embedding model (e.g. `jina-embeddings-v3`) when using Jina. |
| `JINA_EMBEDDING_URL` | Jina embeddings API endpoint. |
| `JINA_API_KEY` | API key for Jina AI services. |
| `FRONTEND_BASE_URL` | Base URL of frontend application (e.g. `http://localhost:5173`). |
| `SMTP_HOST` | SMTP server address for transactional emails. |
| `SMTP_PORT` | SMTP port (e.g. `587`). |
| `SMTP_USERNAME` | SMTP username. |
| `SMTP_PASSWORD` | SMTP password. |
| `SMTP_FROM_EMAIL` | Sender email address for password resets and verification. |
| `SMTP_USE_TLS` | Boolean (`true`/`false`) specifying whether TLS is used. |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for social login. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret for social login. |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL (e.g. `http://localhost:8000/auth/google/callback`). |

---

## API Overview

| Tag | Method | Endpoint | Description |
| --- | --- | --- | --- |
| **Auth** | `POST` | `/auth/register` | Register a new user account |
| **Auth** | `POST` | `/auth/login` | Authenticate user and issue JWT token |
| **Auth** | `POST` | `/auth/forgot-password` | Request password reset email |
| **Auth** | `POST` | `/auth/reset-password` | Reset password using verified token |
| **Auth** | `GET` | `/auth/verify-auth-credentials` | Verify user email credentials |
| **Auth** | `GET` | `/auth/google/login` | Initiate Google OAuth flow |
| **Auth** | `GET` | `/auth/google/callback` | Google OAuth callback handler |
| **Auth** | `GET` | `/auth/me` | Fetch currently authenticated user profile |
| **Auth** | `PATCH` | `/auth/me` | Update authenticated user profile |
| **Auth** | `POST` | `/auth/change-password` | Update account password |
| **Auth** | `GET` | `/auth/settings` | Get user workspace and LLM settings |
| **Auth** | `PATCH` | `/auth/settings` | Update user workspace and LLM settings |
| **Conversations** | `GET` | `/conversations` | List user conversations |
| **Conversations** | `POST` | `/conversations` | Create a new conversation |
| **Conversations** | `DELETE` | `/conversations/{id}` | Delete conversation and messages |
| **Conversations** | `GET` | `/conversations/{id}/messages` | Get message history for a conversation |
| **Conversations** | `POST` | `/conversations/{id}/messages` | Send message and generate AI response |
| **Conversations** | `POST` | `/conversations/{id}/regenerate` | Regenerate response for last query |
| **Conversations** | `POST` | `/conversations/{id}/retrieve` | Retrieve matching document chunks |
| **Conversations** | `GET` | `/conversations/{id}/summary` | Generate / fetch summary for conversation documents |
| **Documents** | `POST` | `/conversations/{id}/documents` | Upload and index document to conversation |
| **Documents** | `GET` | `/conversations/{id}/documents` | List attached documents for conversation |
| **Documents** | `DELETE` | `/documents/{id}` | Remove document and vector embeddings |
| **Test** | `GET` | `/test/health` | Service health status check |
| **Test** | `GET` | `/test/db-test` | Verify PostgreSQL connection |

---

## Project Structure

```text
docuquery-project/
├── backend/
│   ├── api/
│   │   ├── auth.py                  # User authentication, Google OAuth & settings routes
│   │   ├── conversations.py         # Conversation management, chat, and retrieval routes
│   │   └── documents.py             # Document upload, processing & indexing routes
│   ├── auth/
│   │   ├── dependencies.py          # FastApi auth dependencies & user validation
│   │   └── security.py              # Password hashing (Argon2) & JWT utilities
│   ├── db/
│   │   ├── database.py              # SQLAlchemy engine, session maker & connection tests
│   │   ├── models.py                # ORM models (User, Conversation, Document, DocumentChunk)
│   │   └── schemas.py               # Pydantic schemas for request/response validation
│   ├── services/
│   │   ├── ai_client.py             # OpenAI-compatible API client integration
│   │   ├── chat_generation.py       # Context-grounded generation & summarization
│   │   ├── data_storage.py          # Local file storage handling
│   │   ├── document_processor.py    # Text extraction (PDF, DOCX, TXT) and chunking
│   │   ├── document_retriever.py    # Hybrid retrieval engine
│   │   ├── email_service.py         # Transactional email service
│   │   ├── vector_search.py         # Vector similarity search (pgvector & FAISS)
│   │   └── templates/               # Transactional HTML email templates
│   └── main.py                      # FastAPI application setup, middleware, and router mounts
├── design/
│   └── glimpse/                     # Application screenshots and visual previews
├── frontend/
│   ├── src/
│   │   ├── components/              # Chat, document manager, layout, and settings components
│   │   ├── context/                 # AuthContext and ThemeContext state management
│   │   ├── pages/                   # Landing, Login, Register, Chat, Settings pages
│   │   └── services/                # Axios API service clients (auth, chat, documents)
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies and build scripts
│   ├── tailwind.config.js           # Tailwind CSS styling configuration
│   └── vite.config.js               # Vite build configuration
├── migrations/                      # Alembic database migration scripts
├── sample_docs/                     # Sample PDF, DOCX, and TXT files for testing
├── alembic.ini                      # Alembic database migration configuration
├── requirement.txt                  # Python backend dependencies
└── README.md                        # Project documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).

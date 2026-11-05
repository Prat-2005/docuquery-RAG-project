# DocuQuery

DocuQuery is an AI-powered document question-answering application. Upload a PDF, DOCX, or TXT file, ask questions in plain language, and receive answers generated from the most relevant passages in the document.

## Features

- Upload and read `.pdf`, `.docx`, and `.txt` files
- Extract and chunk document text
- Create vector embeddings through a local or optional third-party provider
- Retrieve relevant passages with FAISS
- Generate context-aware answers with a local OpenAI-compatible LLM
- Summarize large documents using chunked, multi-stage summarization
- Regenerate answers and edit previous questions
- Keep the current chat available across page refreshes during the browser session

## Requirements

- Python 3.10 or newer
- A local OpenAI-compatible model endpoint, such as Ollama or LM Studio

## Setup

1. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install the dependencies:

   ```powershell
   pip install -r requirement.txt
   ```

3. Create your environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Update `.env` with your local endpoint and chat model. Embedding providers are configured only in `.env`.

5. Start the application:

   ```powershell
   python -m uvicorn backend.main:app --reload
   ```

   Or, when using `uv`:

   ```powershell
   uv run uvicorn backend.main:app --reload
   ```

6. Open http://127.0.0.1:8000 in your browser.

## Environment Variables

| Variable | Description |
| --- | --- |
| `LLM_URL` | Local OpenAI-compatible API base URL, for example `http://localhost:11434`. |
| `LLM_MODEL` | Local model name used for answers and titles. |
| `EMBEDDING_PROVIDER` | `local` (default) or optional `jina`; configured only in `.env`. |
| `LOCAL_EMBEDDING_MODEL` | Local embedding model, when `EMBEDDING_PROVIDER=local`. |
| `JINA_EMBEDDING_MODEL` | Third-party Jina embedding model, when `EMBEDDING_PROVIDER=jina`. |
| `JINA_EMBEDDING_URL` | Jina embedding endpoint, when `EMBEDDING_PROVIDER=jina`. |
| `JINA_API_KEY` | Jina API key, when `EMBEDDING_PROVIDER=jina`. |
| `LLM_API_KEY` | Optional key for a local server that requires authentication. |

For local Ollama, configure:

```env
LLM_URL=http://localhost:11434
LLM_MODEL=YOUR_LOCAL_CHAT_MODEL
LLM_API_KEY=
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=YOUR_LOCAL_EMBEDDING_MODEL
```

To use the optional third-party Jina embedding model instead:

```env
EMBEDDING_PROVIDER=jina
JINA_EMBEDDING_MODEL=jina-embeddings-v3
JINA_EMBEDDING_URL=https://api.jina.ai/v1/embeddings
JINA_API_KEY=YOUR_JINA_API_KEY
```

## API Endpoints

- `GET /health` - Check whether the API is running.
- `POST /upload` - Upload and index a document, then generate a summary.
- `POST /retrieve` - Retrieve relevant document context for a question.
- `POST /generate` - Generate an answer from retrieved context.
- `POST /regenerate` - Generate an improved answer using the previous answer.

The interactive API documentation is available at http://127.0.0.1:8000/docs.

## Project Structure

```text
.
|-- main.py                 # FastAPI application and API routes
|-- backend/
|   |-- generation.py       # LLM calls and document summarization
|   `-- retrieval.py        # Text extraction, chunking, embeddings, and search
|-- frontend/               # Static HTML, CSS, and JavaScript interface
|-- sample_docs/            # Example documents
|-- .env.example            # Environment variable template
|-- requirement.txt         # Python dependencies
`-- README.md
```

## Notes

- Uploaded document indexing is stored in memory by the running server and is reset when the application stops.
- The frontend chat is stored in browser `sessionStorage`, so it survives refreshes but is cleared when the browser session ends or a new document is uploaded.
- Generation is sent only to the configured local endpoint. Embeddings use the
  provider selected in `.env` and are cached in `.cache/embedding_cache.sqlite3`.
- The selected embedding model must return 384-dimensional vectors for the
  existing pgvector column. Re-index documents after changing providers.
- Large-document summaries make multiple LLM requests and may take longer than short documents.

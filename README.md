# DocuQuery

DocuQuery is an AI-powered document question-answering application. Upload a PDF, DOCX, or TXT file, ask questions in plain language, and receive answers generated from the most relevant passages in the document.

## Features

- Upload and read `.pdf`, `.docx`, and `.txt` files
- Extract and chunk document text
- Create vector embeddings with Sentence Transformers
- Retrieve relevant passages with FAISS
- Generate context-aware answers with an OpenAI-compatible LLM
- Summarize large documents using chunked, multi-stage summarization
- Regenerate answers and edit previous questions
- Keep the current chat available across page refreshes during the browser session

## Requirements

- Python 3.10 or newer
- An OpenAI-compatible LLM endpoint
- Ollama, OpenAI, or another compatible provider

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

4. Update `.env` with your LLM endpoint, model, and API key.

5. Start the application:

   ```powershell
   uvicorn main:app --reload
   ```

   Or, when using `uv`:

   ```powershell
   uv run uvicorn main:app --reload
   ```

6. Open http://127.0.0.1:8000 in your browser.

## Environment Variables

| Variable | Description |
| --- | --- |
| `LLM_PROVIDER` | Optional provider label, such as `ollama` or `openai`. |
| `LLM_URL` | OpenAI-compatible API base URL. |
| `LLM_MODEL` | Model name used for answers and summaries. |
| `LLM_API_KEY` | API key accepted by the configured endpoint. |

For local Ollama, the default values are usually:

```env
LLM_PROVIDER=YOUR_LLM_PROVIDER
LLM_URL=YOUR_LLM_PROVIDER_URL
LLM_MODEL=YOUR_LLM_MODEL
LLM_API_KEY=YOUR_LLM_API_KEY
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
- The first use of `all-MiniLM-L6-v2` downloads the embedding model.
- Large-document summaries make multiple LLM requests and may take longer than short documents.

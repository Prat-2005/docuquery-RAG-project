from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.api.auth import router as auth_router
from backend.api.conversations import router as conversations_router
from backend.retrieval import DocumentRetriever, RetrieverError
from backend.generation import GenerativeGPT
from backend.db.database import test_db_connection

app = FastAPI(
    title="DocuQuery - AI-Assited Document Reader",
    openapi_tags=[
        {"name": "Authentication", "description": "User login and registration"},
        {"name": "Main Service", "description": "Main app endpoints"},
        {"name": "Test", "description": "Test and Connections"}
    ],
)

app.include_router(auth_router)
app.include_router(conversations_router)

service_router = APIRouter(prefix="/main", tags=["Main Service"])
test_router = APIRouter(prefix="/test", tags=["Test"])

app.include_router(service_router)
app.include_router(test_router)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
retriever = DocumentRetriever()
generator = GenerativeGPT()

class QuestionRequest(BaseModel):
    question: str
    improv_answer: str
    top_k: int = 3

@test_router.get("/health")
def health_check():
    return {"status": "running"}

@service_router.get("/")
def frontend_home():
    return FileResponse("frontend/index.html")

@test_router.get("/db-test")
def db_test():
    result = test_db_connection()
    return result

@service_router.post("/upload")
async def get_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .pdf, .docx & .txt files are supported",
        )

    file_data = await file.read()

    if not file_data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty!")

    temporary_file = None

    try:
        temporary_file = NamedTemporaryFile(
            mode="wb",
            suffix=extension,
            delete=False,
        )
        temporary_file.write(file_data)
        temporary_file.close()

        retriever.reset()
        retriever.upload(temporary_file.name)
        retriever.chunk()
        retriever.embedding()

        try:
            summary = generator.summarize_document(retriever.content)
        except Exception:
            summary = "The document was indexed successfully. Ask a question to explore its content."

        return {
            "filename": file.filename,
            "message": "Document uploaded successfully!",
            "chunk_count": len(retriever.chunks),
            "summary": summary,
        }

    except RetrieverError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}",
        ) from e

    finally:
        if temporary_file is not None:
            Path(temporary_file.name).unlink(missing_ok=True)

@service_router.post("/retrieve")
def retrieve_context(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    if retriever.index is None:
        raise HTTPException(
            status_code=400,
            detail="Upload a document before retrieving context"
        )

    try:
        retriever.retrieve(
            query=request.question,
            top_k=request.top_k,
        )

        return {
            "question": request.question,
            "context": retriever.relevant_context(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        ) from e

@service_router.post("/generate")
def generate_answer(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    if retriever.index is None:
        raise HTTPException(
            status_code=400,
            detail="Upload a document before asking a question",
        )

    try:
        retriever.retrieve(
            query=request.question,
            top_k=request.top_k,
        )

        context = retriever.relevant_context()

        request.improv_answer = generator.generate(
            context=context,
            question=request.question,
        )

        return {
            "question": request.question,
            "answer": request.improv_answer,
            "context": context,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

@service_router.post("/regenerate")
def regenerate_answer(request: QuestionRequest):
    if retriever.index is None:
        raise HTTPException(
            status_code=400,
            detail="Call /upload before regenerating",
        )

    if request.improv_answer is None:
        raise HTTPException(
            status_code=400,
            detail="Call /generate before regenerating"
        )

    try:
        retriever.retrieve(request.question, request.top_k)
        context = retriever.relevant_context()

        answer = generator.regenerate(
            context=context,
            question=request.question,
            previous_answer=request.improv_answer,
        )

        return {
            "question": request.question,
            "answer": answer,
            "context": context,
        }

    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
import os

from fastapi import FastAPI, APIRouter
from starlette.middleware.sessions import SessionMiddleware

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api.auth import router as auth_router
from backend.api.auth import verification_router
from backend.api.conversations import router as conversations_router
from backend.api.documents import router as documents_router
from backend.db.database import test_db_connection
from backend.services.chat_generation import GenerativeGPT


app = FastAPI(
    title="DocuQuery - AI-Assited Document Reader",
    openapi_tags=[
        {"name": "Authentication", "description": "User login and registration"},
        {"name": "Test", "description": "Test and Connections"}
    ],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET") or os.getenv("JWT_SECRET_KEY", ""),
)

app.include_router(auth_router)
app.include_router(verification_router)
app.include_router(conversations_router)
app.include_router(documents_router)

test_router = APIRouter(prefix="/test", tags=["Test"])

app.include_router(test_router)

generator = GenerativeGPT()

@test_router.get("/health")
def health_check():
    return {"status": "running"}

@test_router.get("/")
def frontend_home():
    return FileResponse("frontend/index.html")

@test_router.get("/db-test")
def db_test():
    result = test_db_connection()
    return result

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile


UPLOAD_ROOT = Path("uploads")
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


async def save_uploaded_files(
    files: list[UploadFile],
    user_id: UUID,
):
    saved_files = []

    for file in files:
        if not file.filename:
            raise HTTPException(400, "Every file must have a filename")

        original_name = Path(file.filename).name
        extension = Path(original_name).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                400,
                "Only .pdf, .docx, and .txt files are supported",
            )

        document_id = uuid4()
        directory = UPLOAD_ROOT / str(user_id) / str(document_id)
        directory.mkdir(parents=True, exist_ok=True)

        storage_path = directory / f"document{extension}"
        file_size = 0

        with storage_path.open("wb") as output_file:
            while chunk := await file.read(1024 * 1024):
                output_file.write(chunk)
                file_size += len(chunk)

        if file_size == 0:
            storage_path.unlink(missing_ok=True)
            raise HTTPException(
                400,
                f"Uploaded file is empty: {original_name}",
            )

        saved_files.append(
            {
                "document_id": document_id,
                "filename": original_name,
                "storage_path": str(storage_path),
                "file_type": extension,
                "size": file_size,
            }
        )

    return saved_files

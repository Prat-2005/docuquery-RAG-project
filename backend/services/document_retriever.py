import docx
import fitz

from pathlib import Path

from backend.services.ai_client import AIClient


class RetrieverError(Exception):
    def __init__(self, message="Please upload a file in .pdf, .txt, .docx"):
        self.message = message

    def __str__(self):
        return self.message


class DocumentRetriever:
    def __init__(self):
        self.content = ""
        self.chunks = []
        self.ai_client = AIClient()

    def upload(self, document: str | Path):
        extension = Path(document).suffix.lower()

        if extension == ".pdf":
            with fitz.open(document) as doc:
                self.content = "".join(page.get_text() for page in doc)
        elif extension == ".docx":
            doc = docx.Document(document)
            self.content = "\n".join(page.text for page in doc.paragraphs)
        elif extension == ".txt":
            with open(document, "r", encoding="utf-8") as file:
                self.content = file.read()
        else:
            raise RetrieverError(
                "Only accepts the file with extension (.pdf, .docx, .txt) format"
            )

        if not self.content.strip():
            raise RetrieverError("No text extracted from the file")

    def chunk(self, chunk_size: int = 350, chunk_overlap: int = 50):
        if chunk_size <= 0:
            raise ValueError("'chunk_size' must be greater than zero")
        if chunk_overlap < 0 or chunk_overlap >= chunk_size:
            raise ValueError(
                "'chunk_overlap' must be greater or equal to zero & "
                "smaller than chunk_size"
            )
        if not self.content.strip():
            raise RuntimeError("Call upload() before chunk()")

        self.chunks.clear()
        start = 0
        context_length = len(self.content)

        while start < context_length:
            end = start + chunk_size

            if end < context_length:
                space_index = self.content.rfind(
                    " ",
                    start + chunk_overlap,
                    end,
                )
                if space_index > start + chunk_overlap:
                    end = space_index

            if end <= start:
                raise RetrieverError(
                    "Chunking failed to advance through the document"
                )

            chunk = self.content[start:end].strip()
            if chunk:
                self.chunks.append(chunk)

            next_start = end - chunk_overlap
            start = max(next_start, start + 1)

            if end >= context_length:
                break

    def embed(self, texts: list[str]) -> list[list[float]]:
        return self.ai_client.embed(texts)

    def reset(self):
        self.content = ""
        self.chunks.clear()

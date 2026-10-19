import fitz
import docx

from pathlib import Path
from sentence_transformers import SentenceTransformer


class RetrieverError(Exception):
    def __init__(self, message="Please upload a file in .pdf, .txt, .docx"):
        self.message = message

    def __str__(self):
        return self.message


class DocumentRetriever:
    def __init__(self):
        self.content = ""
        self.chunks = []
        self.model = None

    def _get_model(self):
        if self.model is None:
            self.model = SentenceTransformer("all-MiniLM-L6-v2")

        return self.model

    def upload(self, document: str | Path):

        extension = Path(document).suffix.lower()

        if extension == ".pdf":
            with fitz.open(document) as doc:
                self.content = "".join([page.get_text() for page in doc])

            if not self.content.strip():
                raise RetrieverError("No text extracted from the file")

        elif extension == ".docx":
            doc = docx.Document(document)

            self.content = "\n".join(
                page.text 
                for page in doc.paragraphs
            )

            if not self.content.strip():
                raise RetrieverError("No text extracted from the file")

        elif extension == ".txt":
            with open(document, 'r', encoding='utf-8') as file:
                self.content = file.read()

            if not self.content.strip():
                raise RetrieverError("No text extracted from the file")
                
        else:
            raise RetrieverError("Only accepts the file with extension (.pdf, .docx, .txt) format")

    def chunk(self, chunk_size: int = 350, chunk_overlap: int = 50):

        if chunk_size <= 0:
            raise ValueError("'chunk_size' must be greater than zero")

        if chunk_overlap < 0 or chunk_overlap >= chunk_size:
            raise ValueError(
                "'chunk_overlap' must be greater or equal to zero & smaller than chunk_size"
            )

        if not self.content.strip():
            raise RuntimeError("Call upload() before chunk()")

        start = 0
        context_length = len(self.content)

        while start < context_length:

            end = start + chunk_size

            if end < context_length:
                space_index = self.content.rfind(' ', start, end)

                # Second condition use to prevent edge case where found space at the end of 'start' index from the right (space_index == start).
                if space_index != -1 and space_index > start:
                    end = space_index

            self.chunks.append(self.content[start:end].strip())
            start = end - chunk_overlap

            if start >= context_length or end >= context_length:
                break
            
    def embed(
        self,
        texts: list[str],
        batch_size: int = 256,
    ) -> list[list[float]]:
        if not texts:
            raise ValueError("At least one text value is required")

        embeddings = self._get_model().encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        return embeddings.tolist()

    def reset(self):
        self.content = ""
        self.chunks.clear()
    
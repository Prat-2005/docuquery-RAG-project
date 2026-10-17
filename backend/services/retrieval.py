import fitz
import docx
import faiss
import numpy as np
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
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = None
        self.filtered_chunk = []

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

    def embedding(self):
        if not self.chunks:
            raise RuntimeError("Call chunk() before embedding()")

        embeddings = self.model.encode(self.chunks, normalize_embeddings=True)

        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(np.array(embeddings, dtype=np.float32))  

    def retrieve(self, query: str, top_k: int=3):
        if self.index is None:
            raise RuntimeError("Call embedding() before retrieve()")

        top_k = min(top_k, len(self.chunks))

        embedded_query = self.model.encode([query], normalize_embeddings=True)

        _, indices = self.index.search(x=np.array(embedded_query, dtype=np.float32), k=top_k)

        self.filtered_chunk = [self.chunks[i] for i in indices[0]]

    def relevant_context(self) -> str:
        return '\n'.join(f" - {chunk}" for chunk in self.filtered_chunk)

    def reset(self):
        self.content = ""
        self.chunks.clear()
        self.filtered_chunk.clear()
        self.index = None
    
"""
if __name__ == '__main__':
    retriever = DocumentRetriever()
    #file = r"sample_docs/file-sample_150kB.pdf"
    file = r"sample_docs/sample-files.com-basic-text.docx"
    #file = r"sample_docs/output-onlinefiletools.txt"
    retriever.upload(file)
    retriever.chunk()
    retriever.embedding()
    retriever.retrieve("What is this document about?", top_k=3)
    results = retriever.relevant_context()
    print(results)
"""
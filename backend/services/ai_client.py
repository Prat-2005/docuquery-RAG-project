from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from abc import ABC, abstractmethod
from pathlib import Path

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()


class AIProviderError(RuntimeError):
    pass


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        raise NotImplementedError


class GeminiProvider(LLMProvider):
    def __init__(self, client: genai.Client, model: str):
        self.client = client
        self.model = model

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        if not response.text:
            raise AIProviderError("Gemini returned an empty response")
        return response.text


class OllamaProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(
            base_url=os.getenv("LLM_URL", "http://localhost:11434/v1"),
            api_key=os.getenv("LLM_API_KEY", "ollama"),
            timeout=120,
        )
        self.model = os.getenv("LLM_MODEL")
        if not self.model:
            raise AIProviderError("LLM_MODEL is not configured for Ollama")

    def generate(self, prompt: str) -> str:
        print(
            f"Ollama: sending generation request to model {self.model}...",
            flush=True,
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = response.choices[0].message.content
        if not answer:
            raise AIProviderError("Ollama returned an empty response")
        print("Ollama: generation request succeeded.", flush=True)
        return answer


class AIClient:
    EMBEDDING_DIMENSIONS = 384
    EMBEDDING_BATCH_SIZE = 32
    GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    JINA_EMBEDDING_MODEL = os.getenv("JINA_EMBEDDING_MODEL", "jina-embeddings-v3")

    def __init__(self):
        self.privacy_mode = os.getenv("PRIVACY_MODE", "off").lower() == "on"
        self.embedding_provider = os.getenv("EMBEDDING_PROVIDER", "auto").lower()
        self.llm_provider = os.getenv("LLM_PROVIDER", "auto").lower()
        self.gemini = None

        google_key = os.getenv("GOOGLE_API_KEY")
        if google_key:
            self.gemini = genai.Client(
                api_key=google_key,
                http_options=types.HttpOptions(timeout=60_000),
            )

        cache_path = Path(
            os.getenv(
                "EMBEDDING_CACHE_PATH",
                ".cache/embedding_cache.sqlite3",
            )
        )
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache = sqlite3.connect(cache_path)
        self.cache.execute(
            """
            CREATE TABLE IF NOT EXISTS embeddings (
                cache_key TEXT PRIMARY KEY,
                embedding TEXT NOT NULL
            )
            """
        )
        self.cache.commit()

    def _retry(self, operation, description: str):
        delay = 1.0
        for attempt in range(4):
            try:
                print(
                    f"{description}: sending request "
                    f"(attempt {attempt + 1}/4)...",
                    flush=True,
                )
                result = operation()
                print(f"{description}: request succeeded.", flush=True)
                return result
            except Exception as error:
                print(
                    f"{description}: attempt {attempt + 1}/4 failed: "
                    f"{type(error).__name__}: {error}",
                    flush=True,
                )
                if attempt == 3:
                    raise AIProviderError(
                        f"{description} failed after 3 retries: {error}"
                    ) from error
                retry_after = getattr(
                    getattr(error, "response", None),
                    "headers",
                    {},
                ).get("Retry-After")
                try:
                    wait_seconds = float(retry_after)
                except (TypeError, ValueError):
                    wait_seconds = delay
                time.sleep(wait_seconds)
                delay = min(delay * 2, 8.0)

    def _cache_key(self, text: str, provider: str) -> str:
        value = f"{provider}:{text}".encode("utf-8")
        return hashlib.sha256(value).hexdigest()

    def _normalize(self, embedding: list[float]) -> list[float]:
        norm = sum(value * value for value in embedding) ** 0.5
        if norm == 0:
            raise AIProviderError("Embedding provider returned a zero vector")
        return [value / norm for value in embedding]

    def _get_cached(self, key: str) -> list[float] | None:
        row = self.cache.execute(
            "SELECT embedding FROM embeddings WHERE cache_key = ?",
            (key,),
        ).fetchone()
        return json.loads(row[0]) if row else None

    def _save_cached(self, key: str, embedding: list[float]) -> None:
        self.cache.execute(
            "INSERT OR REPLACE INTO embeddings(cache_key, embedding) VALUES (?, ?)",
            (key, json.dumps(embedding)),
        )
        self.cache.commit()

    def _gemini_embeddings(self, texts: list[str]) -> list[list[float]]:
        if self.gemini is None:
            raise AIProviderError("GOOGLE_API_KEY is not configured")

        def request():
            response = self.gemini.models.embed_content(
                model=self.GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    outputDimensionality=self.EMBEDDING_DIMENSIONS,
                ),
            )
            return [
                [float(value) for value in embedding.values]
                for embedding in response.embeddings
            ]

        return self._retry(request, "Gemini embedding request")

    def _jina_embeddings(self, texts: list[str]) -> list[list[float]]:
        api_key = os.getenv("JINA_API_KEY")
        if not api_key:
            raise AIProviderError("JINA_API_KEY is not configured")

        def request():
            response = requests.post(
                "https://api.jina.ai/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.JINA_EMBEDDING_MODEL,
                    "input": texts,
                    "dimensions": self.EMBEDDING_DIMENSIONS,
                    "normalized": True,
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json().get("data", [])
            return [
                [float(value) for value in item["embedding"]]
                for item in sorted(data, key=lambda item: item["index"])
            ]

        return self._retry(request, "Jina embedding request")

    def _provider_state_path(self) -> Path:
        return Path(
            os.getenv(
                "EMBEDDING_PROVIDER_STATE_PATH",
                ".cache/embedding_provider.txt",
            )
        )

    def _read_provider_state(self) -> str | None:
        path = self._provider_state_path()
        return path.read_text(encoding="utf-8").strip() if path.exists() else None

    def _write_provider_state(self, provider: str) -> None:
        path = self._provider_state_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(provider, encoding="utf-8")

    def embed(self, chunks: list[str]) -> list[list[float]]:
        if not chunks:
            raise ValueError("At least one text value is required")

        use_jina = self.privacy_mode or self.embedding_provider == "jina"
        if self.embedding_provider not in {"auto", "gemini", "jina"}:
            raise AIProviderError(
                "EMBEDDING_PROVIDER must be auto, gemini, or jina"
            )

        provider = "jina" if use_jina else "gemini"
        if self.embedding_provider == "auto" and not self.privacy_mode:
            provider = self._read_provider_state() or provider
        embeddings: list[list[float] | None] = [None] * len(chunks)
        pending: list[tuple[int, str]] = []

        for index, chunk in enumerate(chunks):
            key = self._cache_key(chunk, provider)
            cached = self._get_cached(key)
            if cached is not None:
                embeddings[index] = cached
            else:
                pending.append((index, chunk))

        def fetch_pending(items, selected_provider):
            generated_items = []
            for batch_start in range(0, len(items), self.EMBEDDING_BATCH_SIZE):
                batch = items[
                    batch_start:batch_start + self.EMBEDDING_BATCH_SIZE
                ]
                pending_texts = [chunk for _, chunk in batch]
                generated = (
                    self._gemini_embeddings(pending_texts)
                    if selected_provider == "gemini"
                    else self._jina_embeddings(pending_texts)
                )
                if len(generated) != len(batch):
                    raise AIProviderError(
                        "Embedding provider returned an incomplete batch"
                    )
                generated_items.extend(zip(batch, generated))
            return generated_items

        try:
            generated_items = fetch_pending(pending, provider)
        except AIProviderError as error:
            if provider != "gemini" or self.embedding_provider != "auto":
                raise
            print(
                f"Gemini embedding unavailable; falling back to Jina: {error}"
            )
            provider = "jina"
            embeddings = [None] * len(chunks)
            pending = list(enumerate(chunks))
            generated_items = fetch_pending(pending, provider)

        if pending:
            self._write_provider_state(provider)

        for (index, chunk), embedding in generated_items:
            if len(embedding) != self.EMBEDDING_DIMENSIONS:
                raise AIProviderError(
                    f"Expected {self.EMBEDDING_DIMENSIONS}-dimensional embeddings"
                )
            normalized = self._normalize(embedding)
            embeddings[index] = normalized
            self._save_cached(self._cache_key(chunk, provider), normalized)

        return [embedding for embedding in embeddings if embedding is not None]

    def _gemini_llm(self) -> GeminiProvider:
        if self.gemini is None:
            raise AIProviderError("GOOGLE_API_KEY is not configured")
        return GeminiProvider(
            self.gemini,
            os.getenv("GOOGLE_GENERATION_MODEL", "gemini-3-flash-preview"),
        )

    def generate(self, prompt: str) -> str:
        if self.llm_provider not in {"auto", "gemini", "ollama"}:
            raise AIProviderError("LLM_PROVIDER must be auto, gemini, or ollama")

        if self.privacy_mode or self.llm_provider == "ollama":
            return OllamaProvider().generate(prompt)

        if self.llm_provider == "gemini":
            return self._gemini_llm().generate(prompt)

        try:
            return self._gemini_llm().generate(prompt)
        except Exception as error:
            print(f"Gemini generation unavailable; falling back to Ollama: {error}")
            return OllamaProvider().generate(prompt)

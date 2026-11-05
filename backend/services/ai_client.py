from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from collections.abc import Mapping
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv


load_dotenv()


class AIProviderError(RuntimeError):
    """Raised when the configured local model cannot complete a request."""


def configure_local_llm(settings: Mapping[str, object] | None = None) -> dict[str, str | None]:
    settings = settings or {}
    provider = settings.get("llm_provider") or os.getenv("LLM_PROVIDER", "local")
    model = settings.get("llm_model") or os.getenv("LLM_MODEL")
    base_url = settings.get("api_base_url") or os.getenv(
        "LLM_URL",
        "http://localhost:11434",
    )
    api_key = settings.get("api_key") or os.getenv("LLM_API_KEY")

    if not isinstance(provider, str) or not provider.strip():
        raise AIProviderError("Local LLM provider name is required.")
    if not isinstance(model, str) or not model.strip():
        raise AIProviderError("Local chat model name is required.")
    if not isinstance(base_url, str) or not base_url.strip():
        raise AIProviderError("Local LLM endpoint URL is required.")

    base_url = base_url.strip().rstrip("/")
    parsed_url = urlparse(base_url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise AIProviderError("A valid HTTP or HTTPS endpoint URL is required.")
    if api_key is not None and not isinstance(api_key, str):
        raise AIProviderError("API key must be a string.")

    return {
        "provider": provider.strip(),
        "model": model.strip(),
        "base_url": base_url,
        "api_key": api_key.strip() if api_key and api_key.strip() else None,
    }


class AIClient:
    EMBEDDING_DIMENSIONS = 384
    EMBEDDING_BATCH_SIZE = 32

    def __init__(self, settings: Mapping[str, object] | None = None):
        self.config = configure_local_llm(settings)
        cache_path = Path(
            os.getenv("EMBEDDING_CACHE_PATH", ".cache/embedding_cache.sqlite3")
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

    @property
    def api_root(self) -> str:
        base_url = str(self.config["base_url"])
        return base_url if base_url.endswith("/v1") else f"{base_url}/v1"

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        api_key = self.config.get("api_key")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        return headers

    def _request(self, path: str, payload: dict, description: str) -> dict:
        delay = 1.0
        for attempt in range(4):
            try:
                response = requests.post(
                    f"{self.api_root}/{path}",
                    headers=self._headers(),
                    json=payload,
                    timeout=120,
                )
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise AIProviderError(f"{description} returned an invalid response.")
                return data
            except (requests.RequestException, ValueError, AIProviderError) as error:
                if attempt == 3:
                    raise AIProviderError(
                        f"{description} failed. Check that the local model server is running."
                    ) from error
                time.sleep(delay)
                delay = min(delay * 2, 8.0)
        raise AssertionError("unreachable")

    def _cache_key(self, text: str) -> str:
        provider = self._embedding_provider()
        model = (
            os.getenv("LOCAL_EMBEDDING_MODEL", "")
            if provider == "local"
            else os.getenv("JINA_EMBEDDING_MODEL", "jina-embeddings-v3")
        )
        value = f"{provider}:{model}:{text}".encode("utf-8")
        return hashlib.sha256(value).hexdigest()

    def _get_cached(self, key: str) -> list[float] | None:
        row = self.cache.execute(
            "SELECT embedding FROM embeddings WHERE cache_key = ?", (key,)
        ).fetchone()
        return json.loads(row[0]) if row else None

    def _save_cached(self, key: str, embedding: list[float]) -> None:
        self.cache.execute(
            "INSERT OR REPLACE INTO embeddings(cache_key, embedding) VALUES (?, ?)",
            (key, json.dumps(embedding)),
        )
        self.cache.commit()

    def _normalize(self, embedding: list[float]) -> list[float]:
        norm = sum(value * value for value in embedding) ** 0.5
        if norm == 0:
            raise AIProviderError("Embedding provider returned a zero vector.")
        return [value / norm for value in embedding]

    def _local_embed_batch(self, texts: list[str]) -> list[list[float]]:
        model = os.getenv("LOCAL_EMBEDDING_MODEL")
        if not model or model.startswith("YOUR_"):
            raise AIProviderError(
                "LOCAL_EMBEDDING_MODEL is required when EMBEDDING_PROVIDER=local."
            )
        response = self._request(
            "embeddings",
            {
                "model": model,
                "input": texts,
            },
            "Local embedding request",
        )
        data = response.get("data")
        if not isinstance(data, list):
            raise AIProviderError("Local embedding response did not contain data.")
        ordered = sorted(data, key=lambda item: item.get("index", 0))
        embeddings = [[float(value) for value in item["embedding"]] for item in ordered]
        if len(embeddings) != len(texts):
            raise AIProviderError("Local embedding model returned an incomplete batch.")
        return embeddings

    def _jina_embed_batch(self, texts: list[str]) -> list[list[float]]:
        api_key = os.getenv("JINA_API_KEY")
        if not api_key or api_key.startswith("YOUR_"):
            raise AIProviderError(
                "JINA_API_KEY is required when EMBEDDING_PROVIDER=jina."
            )

        response = requests.post(
            os.getenv("JINA_EMBEDDING_URL", "https://api.jina.ai/v1/embeddings"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": os.getenv("JINA_EMBEDDING_MODEL", "jina-embeddings-v3"),
                "input": texts,
                "dimensions": self.EMBEDDING_DIMENSIONS,
                "normalized": True,
            },
            timeout=120,
        )
        try:
            response.raise_for_status()
            data = response.json().get("data", [])
            ordered = sorted(data, key=lambda item: item["index"])
            embeddings = [
                [float(value) for value in item["embedding"]]
                for item in ordered
            ]
        except (requests.RequestException, ValueError, KeyError, TypeError) as error:
            raise AIProviderError("Third-party embedding request failed.") from error

        if len(embeddings) != len(texts):
            raise AIProviderError(
                "Third-party embedding provider returned an incomplete batch."
            )
        return embeddings

    def _embedding_provider(self) -> str:
        provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
        if provider not in {"local", "jina"}:
            raise AIProviderError("EMBEDDING_PROVIDER must be local or jina.")
        return provider

    def embed(self, chunks: list[str]) -> list[list[float]]:
        if not chunks:
            raise ValueError("At least one text value is required.")

        provider = self._embedding_provider()
        embeddings: list[list[float] | None] = [None] * len(chunks)
        pending: list[tuple[int, str]] = []
        for index, chunk in enumerate(chunks):
            cache_key = self._cache_key(f"{provider}:{chunk}")
            cached = self._get_cached(cache_key)
            if cached is None:
                pending.append((index, chunk))
            else:
                embeddings[index] = cached

        for start in range(0, len(pending), self.EMBEDDING_BATCH_SIZE):
            batch = pending[start : start + self.EMBEDDING_BATCH_SIZE]
            generated = (
                self._jina_embed_batch([text for _, text in batch])
                if provider == "jina"
                else self._local_embed_batch([text for _, text in batch])
            )
            for (index, chunk), embedding in zip(
                batch, generated
            ):
                if len(embedding) != self.EMBEDDING_DIMENSIONS:
                    raise AIProviderError(
                        f"Embedding provider must return {self.EMBEDDING_DIMENSIONS}-dimensional vectors."
                    )
                normalized = self._normalize(embedding)
                embeddings[index] = normalized
                self._save_cached(self._cache_key(f"{provider}:{chunk}"), normalized)

        return [embedding for embedding in embeddings if embedding is not None]

    def generate(self, prompt: str) -> str:
        response = self._request(
            "chat/completions",
            {
                "model": self.config["model"],
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            },
            "Local generation request",
        )
        try:
            content = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise AIProviderError(
                "Local generation response did not contain a message."
            ) from error
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("Local generation returned an empty response.")
        return content.strip()

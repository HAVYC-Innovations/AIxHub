from __future__ import annotations

import time
from typing import Iterable

from huggingface_hub import InferenceClient

from .config import get_settings
from .models import ChatMessage, GeneratePayload, GenerateResponse


class HuggingFaceService:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = InferenceClient(token=settings.hf_api_token)
        self._default_model = settings.default_model

    def _build_messages(self, payload: GeneratePayload) -> Iterable[dict[str, str]]:
        for message in payload.history:
            yield {"role": message.role.value, "content": message.content}
        yield {"role": "user", "content": payload.prompt}

    def run_completion(self, payload: GeneratePayload) -> GenerateResponse:
        model = payload.model or self._default_model
        start = time.perf_counter()
        response = self._client.chat.completions.create(
            model=model,
            messages=list(self._build_messages(payload)),
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        content = response.choices[0].message["content"]
        text = content if isinstance(content, str) else content[0].get("text", "")
        return GenerateResponse(model=model, output=text, latency_ms=latency_ms)


hf_service = HuggingFaceService()

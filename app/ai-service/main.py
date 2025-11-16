from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.models import GeneratePayload, GenerateResponse
from app.service import hf_service

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")

if settings.allowed_backend_origin:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(settings.allowed_backend_origin)],
        allow_methods=["POST", "OPTIONS"],
        allow_headers=["*"]
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.post("/ai/generate", response_model=GenerateResponse)
def generate(payload: GeneratePayload) -> GenerateResponse:
    try:
        return hf_service.run_completion(payload)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.exception_handler(Exception)
def unhandled_exception_handler(_, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": str(exc)})

from functools import lru_cache
from pydantic import BaseSettings, HttpUrl


class Settings(BaseSettings):
    app_name: str = "AIxHub AI Service"
    environment: str = "development"
    hf_api_token: str
    default_model: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    allowed_backend_origin: HttpUrl | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]

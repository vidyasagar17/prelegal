"""Application settings, read from the environment (and an optional .env)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Read the project-root .env for local dev; env vars still win. In the
    # container the OPENAI_API_KEY is passed at runtime.
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    # Auth
    jwt_secret: str = "dev-secret-change-me-in-production-please-32b"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # one day
    cookie_name: str = "prelegal_auth"
    cookie_secure: bool = False  # True behind HTTPS in production

    # Database (SQLite). The container filesystem is ephemeral, so this file is
    # recreated from scratch every time the container starts.
    db_path: str = "prelegal.db"

    # Directory holding the statically-exported frontend. Mounted at "/" when it
    # exists; absent during backend-only test runs.
    frontend_dir: str = "static"

    # LLM (OpenAI platform via LiteLLM). The key comes from the environment or
    # the project-root .env (openai_api_key), never baked into the image.
    openai_api_key: str = ""
    chat_model: str = "openai/gpt-4o-mini"


settings = Settings()

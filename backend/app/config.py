"""Application settings, read from the environment (and an optional .env)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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


settings = Settings()

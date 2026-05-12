from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str = "postgresql+asyncpg://fts:fts@db:5432/fts"
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    ai_model: str = "anthropic/claude-3.5-sonnet"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    oidc_issuer: str
    oidc_audience: str
    oidc_jwks_url: str


settings = Settings()

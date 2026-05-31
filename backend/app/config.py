import os

class Settings:
    # Postgres Database Configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "inventory_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    # Generate standard fallback database URL if not explicitly provided
    DEFAULT_DATABASE_URL: str = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

    # CORS configuration
    CORS_ORIGINS: list = ["*"]

settings = Settings()

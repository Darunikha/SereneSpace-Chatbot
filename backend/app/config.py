import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    openrouter_api_key: str = Field(default="your_openrouter_api_key_here", validation_alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="meta-llama/llama-3-8b-instruct:free", validation_alias="OPENROUTER_MODEL")
    vector_db_path: str = Field(default="./data/vector_store", validation_alias="VECTOR_DB_PATH")
    top_k: int = Field(default=4, validation_alias="TOP_K")
    port: int = Field(default=8000, validation_alias="PORT")
    host: str = Field(default="127.0.0.1", validation_alias="HOST")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

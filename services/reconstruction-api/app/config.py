from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    reconstruction_mode: Literal['disabled', 'local', 'external'] = 'disabled'
    data_dir: Path = Path('./data')
    cors_origins: str = 'http://localhost:3000'
    max_images: int = 12
    max_image_bytes: int = 6 * 1024 * 1024
    model_base_url: str = ''
    local_engine_command: str = ''
    external_worker_url: str = ''
    external_worker_timeout_seconds: int = 1800

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(',') if item.strip()]

settings = Settings()

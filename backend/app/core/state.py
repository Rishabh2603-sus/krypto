from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

DEMO_PROFILES: Dict[str, Path] = {
    "default": DATA_DIR / "demo.csv",
    "saas": DATA_DIR / "demo_saas.csv",
    "retail": DATA_DIR / "demo_retail.csv",
}

PROFILE_ALIASES: Dict[str, str] = {
    "default": "default",
    "manufacturing msme": "default",
    "manufacturing": "default",
    "msme": "default",
    "saas": "saas",
    "saas startup": "saas",
    "retail": "retail",
    "d2c retail": "retail",
    "d2c": "retail",
}

class AppState:
    def __init__(self):
        self._current_dataset_path: Path = DEMO_PROFILES["default"]
        self._current_profile: str = "default"

    def get_dataset_path(self) -> Path:
        return self._current_dataset_path

    def get_profile(self) -> str:
        return self._current_profile

    def set_dataset_path(self, path: Path, profile_name: str = "custom") -> None:
        self._current_dataset_path = path
        self._current_profile = profile_name

    def switch_profile(self, profile: str) -> Path:
        raw_key = profile.lower().strip()
        key = PROFILE_ALIASES.get(raw_key, raw_key)
        if key not in DEMO_PROFILES:
            raise ValueError(f"Unknown profile '{profile}'. Valid profiles: {list(DEMO_PROFILES.keys())}")
        self._current_dataset_path = DEMO_PROFILES[key]
        self._current_profile = key
        return self._current_dataset_path

app_state = AppState()

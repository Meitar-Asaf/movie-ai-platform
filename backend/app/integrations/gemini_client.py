import json

import requests

from app.core.config import settings


class GeminiClient:
    def __init__(self) -> None:
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model

    def recommend(self, liked_movies: list[str], candidates: list[dict]) -> list[dict]:
        if not self.api_key:
            return []

        prompt = {
            "liked_movies": liked_movies,
            "candidates": candidates,
            "instruction": "Return strict JSON list with up to 5 objects: {movie_id:int,title:str,reason:str}",
        }

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": json.dumps(prompt)}
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.4},
        }

        response = requests.post(url, json=body, timeout=20)
        response.raise_for_status()
        data = response.json()

        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "[]")
        )

        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            return []
        return []

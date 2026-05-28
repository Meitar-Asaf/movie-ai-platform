import json
import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


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
            "instruction": "Return strict JSON list with up to 5 objects: {movie_key:str,title:str,reason:str}",
        }

        models_to_try = [self.model, "gemini-1.5-flash"]

        def build_body(payload: dict) -> dict:
            return {
                "contents": [
                    {
                        "parts": [
                            {"text": json.dumps(payload)}
                        ]
                    }
                ],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
            }

        data = None
        for model_name in models_to_try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                f"?key={self.api_key}"
            )
            try:
                response = requests.post(url, json=build_body(prompt), timeout=20)
                if response.status_code == 429:
                    logger.warning("Gemini model %s rate-limited. Retrying with a smaller candidate set.", model_name)
                    reduced_prompt = {
                        **prompt,
                        "candidates": candidates[:12],
                        "liked_movies": liked_movies[:8],
                    }
                    response = requests.post(url, json=build_body(reduced_prompt), timeout=20)

                response.raise_for_status()
                data = response.json()
                break
            except requests.RequestException as exc:
                logger.warning("Gemini recommend failed for model %s: %s", model_name, exc)

        if data is None:
            return []

        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "[]")
        )

        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()

        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            return []
        return []

    def generate_catalog(
        self,
        count: int = 30,
        liked_movies: list[str] | None = None,
        query: str | None = None,
    ) -> list[dict]:
        if not self.api_key:
            return []

        prompt = {
            "instruction": (
                "Return strict JSON list only. Generate movies personalized to user preferences. "
                "Each item: {title:str,year:int,genres:str,overview:str}. No markdown."
            ),
            "count": max(8, min(count, 24)),
            "liked_movies": liked_movies or [],
            "search_query": (query or "").strip(),
        }

        models_to_try = [self.model, "gemini-1.5-flash"]

        def build_body(payload: dict) -> dict:
            return {
                "contents": [
                    {
                        "parts": [
                            {"text": json.dumps(payload)}
                        ]
                    }
                ],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1200},
            }

        data = None
        for model_name in models_to_try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                f"?key={self.api_key}"
            )
            try:
                response = requests.post(url, json=build_body(prompt), timeout=20)
                if response.status_code == 429:
                    logger.warning("Gemini model %s rate-limited for catalog. Retrying with smaller count.", model_name)
                    reduced_prompt = {
                        **prompt,
                        "count": min(prompt["count"], 10),
                        "liked_movies": (liked_movies or [])[:8],
                    }
                    response = requests.post(url, json=build_body(reduced_prompt), timeout=20)

                response.raise_for_status()
                data = response.json()
                break
            except requests.RequestException as exc:
                logger.warning("Gemini catalog generation failed for model %s: %s", model_name, exc)

        if data is None:
            return []

        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "[]")
        ).strip()

        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()

        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            return []
        return []

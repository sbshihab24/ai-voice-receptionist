import requests
from fastapi import APIRouter, HTTPException
from app.core.config import OPENAI_API_KEY, OPENAI_REALTIME_MODEL, OPENAI_REALTIME_VOICE, OPENAI_BASE_URL
from app.core.prompts import system_prompt

router = APIRouter()

@router.get("/session")
def create_session():
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY in environment")

    response = requests.post(
        f"{OPENAI_BASE_URL}/realtime/sessions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENAI_REALTIME_MODEL,
            "voice": OPENAI_REALTIME_VOICE,
            "instructions": system_prompt()
        },
        timeout=20,
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return response.json()
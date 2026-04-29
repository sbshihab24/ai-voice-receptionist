AI Voice Receptionist — Project Notes (redmi.md)

Overview
--------
This repository implements a minimal AI Voice Receptionist using OpenAI Realtime (WebRTC) and a FastAPI backend. The frontend provides a simple mobile-style call UI that opens a live voice session with the assistant.

Quick features
--------------
- Real-time voice call via browser (microphone + audio playback)
- Language mirroring per-question (Bangla / English)
- Grounded responses from project knowledge files
- Simple, local-run backend and static frontend

Files to know
--------------
- `backend/app/main.py` — FastAPI app initialization
- `backend/run.py` — starts Uvicorn for the backend
- `backend/app/routes/session.py` — creates realtime OpenAI session (returns client_secret token)
- `backend/app/core/prompts.py` — system prompt used to shape the receptionist behavior
- `backend/app/services/rag_service.py` — loads knowledge source(s)
- `backend/app/data/knowledge.txt` — primary company facts and FAQ
- `frontend/index.html`, `frontend/app.js`, `frontend/style.css` — browser UI and WebRTC client
- `.env` — project environment variables (OPENAI_API_KEY, etc.) — DO NOT COMMIT
- `.gitignore` — ignores venv and .env

Run locally (Windows PowerShell)
-------------------------------
Activate virtualenv and run install (if needed):

```powershell
# activate venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& .\.venv\Scripts\Activate.ps1

# install dependencies (only once)
python -m pip install -r backend\requirements.txt
```

Start backend and frontend servers (two terminals):

```powershell
# Terminal 1 — backend
Set-Location "c:\Project\ai-voice-receptionist\backend"
& c:\Project\ai-voice-receptionist\.venv\Scripts\python.exe run.py

# Terminal 2 — frontend (simple static file server)
Set-Location "c:\Project\ai-voice-receptionist\frontend"
& c:\Project\ai-voice-receptionist\.venv\Scripts\python.exe -m http.server 5500
```

Then open the frontend at: http://localhost:5500
Click `Start Call` to begin a live session.

Environment variables
---------------------
Set these in `.env` (project root) or your environment before running:
- `OPENAI_API_KEY` — your OpenAI API key
- `OPENAI_REALTIME_MODEL` — e.g. `gpt-4o-realtime-preview`
- `OPENAI_REALTIME_VOICE` — e.g. `alloy`
- `OPENAI_BASE_URL` — (optional) defaults to https://api.openai.com/v1

Where to add company docs / FAQ
-------------------------------
Simple approach (no code change):
- Append new sections to `backend/app/data/knowledge.txt`.

Recommended (multi-file) approach:
- Create files under `backend/app/data/` such as `faq.txt`, `pricing.txt`, `services_detailed.txt`.
- Update `backend/app/services/rag_service.py` to read and combine these files before returning content to the prompt.

Example `load_knowledge()` for multi-file:

```python
def load_knowledge():
    files = ["knowledge.txt", "faq.txt", "services_detailed.txt"]
    parts = []
    for fn in files:
        path = f"app/data/{fn}"
        try:
            with open(path, "r", encoding="utf-8") as f:
                parts.append(f.read())
        except FileNotFoundError:
            continue
    return "\n\n---\n\n".join(parts)
```

Smart retrieval (next step)
---------------------------
For large docs, add a semantic search layer (embeddings + vector DB) to retrieve only relevant passages per query before sending to the prompt. This improves accuracy and keeps prompts small.

Prompt & Language behavior
--------------------------
- The active system prompt is in `backend/app/core/prompts.py` and is designed to be:
  - Human-like (first-person), warm and concise
  - Strictly grounded to `knowledge.txt` (do not invent)
  - Per-question language detection and mirroring (Bangla / English)
  - First Bangla answer includes a short Bangla self-intro, subsequent Bangla replies do not repeat it

Testing language switching
-------------------------
1. Start a call.
2. Speak in Bangla first — assistant should reply in Bangla and include the Bangla intro once.
3. Immediately ask a question in English — assistant should switch and reply in English.
4. Ask another Bangla question — assistant should reply in Bangla without repeating intro.
5. Mixed-language questions are answered in the dominant language.

If you observe incorrect behavior, check:
- `backend/app/core/prompts.py` (prompt rules)
- `backend/app/data/knowledge.txt` (source facts)
- Browser console and backend logs for runtime errors

Security note
-------------
- Keep `OPENAI_API_KEY` secret and do not commit `.env`.
- Rotate keys after testing if exposed.

Next improvements (suggestions)
-----------------------------
- Add `faq.txt` and wire semantic retrieval for better answer precision
- Add a transcript UI to the frontend (show text of user & assistant)
- Add call recording/storage and post-call summary endpoint
- Add automated tests for prompt outputs (unit test harness mocking the model)

Contact
-------
If you want, I can implement the multi-file knowledge loader and a small FAQ example file now. Would you like me to do that?
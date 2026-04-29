from fastapi import FastAPI
from app.routes.session import router as session_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Voice Receptionist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session_router)

@app.get("/")
def root():
    return {"message": "AI Voice Receptionist Backend Running"}
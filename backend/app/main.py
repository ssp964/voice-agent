import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from io import BytesIO

from .services.stt_service import SpeechToTextService
from .services.tts_service import TextToSpeechService


def append_transcript_log(text: str) -> None:
    """Log STT transcript to data/transcripts.txt"""
    os.makedirs("data", exist_ok=True)
    log_path = os.path.join("data", "transcripts.txt")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"{datetime.utcnow().isoformat()}\t{text}\n")


def create_app() -> FastAPI:
    app = FastAPI(title="Voice Agent Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    stt_service = SpeechToTextService()
    tts_service = TextToSpeechService()

    @app.get("/api/tts-text")
    async def get_tts_text():
        """Return the fixed TTS text stored in data/tts_text.txt."""
        try:
            os.makedirs("data", exist_ok=True)
            file_path = os.path.join("data", "tts_text.txt")
            if not os.path.exists(file_path):
                # Initialize with a default phrase if missing
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("Hello, how are you?")
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read().strip()
            return {"text": text}
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    @app.post("/api/stt")
    async def stt(file: UploadFile = File(...)):
        try:
            audio_bytes = await file.read()
            text = stt_service.transcribe(audio_bytes)
            append_transcript_log(text)
            return {"text": text}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/tts")
    async def tts(payload: dict):
        text = payload.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="text is required")
        try:
            wav_bytes = tts_service.synthesize_to_wav_bytes(text)
            return StreamingResponse(
                BytesIO(wav_bytes),
                media_type="audio/wav",
                headers={"Content-Disposition": "inline; filename=tts.wav"},
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    return app


app = create_app()

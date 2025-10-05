# Voice Chatbot

Voice AI agent with STT/TTS capabilities using Next.js + FastAPI.

## Quick Start

### One-command (Docker Compose)
```bash
docker compose up --build
```
Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- n8n: http://localhost:5678

## Usage

1. Open `http://localhost:3000`
2. Click mic button and speak
3. System transcribes speech and plays fixed response

## Configuration

- **TTS Response**: Edit `backend/data/tts_text.txt`
- **View Transcripts**: `cat backend/data/transcripts.txt`

## Access Points

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- n8n: `http://localhost:5678`

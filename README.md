# Voice Chatbot

Voice AI agent with STT/TTS capabilities using Next.js + FastAPI.

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./run.sh
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### n8n (Optional)
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

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

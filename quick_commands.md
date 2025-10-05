# Ollama Base URL Configuration

## If using ollama inside docker:
http://ollama:11434

## If using ollama on host:
http://host.docker.internal:11434

# Docker Installation Commands

## Setup n8n and ollama only:
```bash
docker compose up -d n8n ollama
```

## Setup the whole web app:
```bash
docker compose up -d --build
```

## Pull ollama model (llama3.2:3b):
```bash
docker exec voice-ollama ollama pull llama3.2:3b
```

# Testing Webhooks

## Using Shell Script (macOS/Linux):
```bash
# Test webhook (click "Execute workflow" in n8n first)
./test_n8n.sh "Hello"

# Production webhook (workflow Active)
./test_n8n.sh "Hello" --prod
```

## Using PowerShell Script (Windows):
```powershell
# Test webhook (click "Execute workflow" in n8n first)
powershell -ExecutionPolicy Bypass -File .\test_n8n.ps1 -Message "Hello"

# Production webhook (workflow Active)
powershell -ExecutionPolicy Bypass -File .\test_n8n.ps1 -Message "Hello" -Prod

# If already in PowerShell:
.\test_n8n.ps1 -Message "Hello"
.\test_n8n.ps1 -Message "Hello" -Prod
```
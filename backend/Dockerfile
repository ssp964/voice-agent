FROM python:3.9-slim

WORKDIR /app

# System deps for PyAV, soundfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    python3-dev \
    cargo \
    rustc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
# Upgrade pip and install requirements (sudachipy needs python3-dev and up-to-date pip)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]



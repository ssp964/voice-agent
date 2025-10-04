import os
from datetime import datetime

from app.services.tts_service import TextToSpeechService
from app.services.stt_service import SpeechToTextService


def append_transcript_log(text: str) -> None:
    os.makedirs("data", exist_ok=True)
    log_path = os.path.join("data", "transcripts.txt")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"{datetime.utcnow().isoformat()}\t{text}\n")


def stt_from_wav_bytes_and_log(wav_bytes: bytes) -> str:
    stt = SpeechToTextService()
    text = stt.transcribe(wav_bytes)
    append_transcript_log(text)
    print("Transcribed:", text)
    return text


import argparse


def main() -> None:
    parser = argparse.ArgumentParser(
        description="TTS/STT test helper with transcript logging"
    )
    parser.add_argument(
        "--text",
        type=str,
        default="testing one two three",
        help="Text to synthesize before transcribing",
    )
    args = parser.parse_args()

    tts = TextToSpeechService()
    wav_bytes = tts.synthesize_to_wav_bytes(args.text)
    stt_from_wav_bytes_and_log(wav_bytes)


if __name__ == "__main__":
    main()

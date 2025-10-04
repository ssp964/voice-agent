from typing import Optional, List
from tempfile import NamedTemporaryFile
from io import BytesIO

import av
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel


class SpeechToTextService:
    def __init__(self, model_size: str = "base", device: str = "cpu") -> None:
        self.model = WhisperModel(model_size, device=device)

    def transcribe(self, audio_bytes: bytes, language: Optional[str] = None) -> str:
        wav_bytes = self._ensure_wav_pcm16(audio_bytes)
        with NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
            tmp.write(wav_bytes)
            tmp.flush()
            # Try Hindi first, then English if Hindi fails
            try:
                segments, _ = self.model.transcribe(tmp.name, language="hi")
                texts = [seg.text for seg in segments]
                result = " ".join(t.strip() for t in texts if t)
                # If Hindi transcription is empty or very short, try English
                if len(result.strip()) < 3:
                    segments, _ = self.model.transcribe(tmp.name, language="en")
                    texts = [seg.text for seg in segments]
                    result = " ".join(t.strip() for t in texts if t)
                return result
            except Exception:
                # Fallback to English if Hindi fails
                segments, _ = self.model.transcribe(tmp.name, language="en")
                texts = [seg.text for seg in segments]
                return " ".join(t.strip() for t in texts if t)

    def _ensure_wav_pcm16(self, audio_bytes: bytes) -> bytes:
        """
        Convert arbitrary compressed audio bytes (e.g., WebM/Opus) to 16kHz mono PCM WAV.
        Uses PyAV for decoding; falls back to raw bytes if already WAV.
        """
        try:
            container = av.open(BytesIO(audio_bytes), mode="r")
            audio_streams = [s for s in container.streams if s.type == "audio"]
            if not audio_streams:
                return audio_bytes
            stream = audio_streams[0]
            resampler = av.audio.resampler.AudioResampler(
                format="s16", layout="mono", rate=16000
            )
            samples: List[np.ndarray] = []
            for packet in container.demux(stream):
                for frame in packet.decode():
                    frame = resampler.resample(frame)
                    arr = frame.to_ndarray()
                    if arr.ndim == 2:
                        arr = arr.mean(axis=0)
                    samples.append(arr.astype(np.int16))
            if not samples:
                return audio_bytes
            pcm = np.concatenate(samples)
            buf = BytesIO()
            sf.write(buf, pcm, 16000, format="WAV", subtype="PCM_16")
            return buf.getvalue()
        except Exception:
            # If decoding fails, return original bytes
            return audio_bytes

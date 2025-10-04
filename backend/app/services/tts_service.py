from io import BytesIO
from typing import Optional

import numpy as np
import soundfile as sf
from TTS.api import TTS


class TextToSpeechService:
    def __init__(self, model_name: Optional[str] = None) -> None:
        # Use a small, readily available model
        self.model_name = model_name or "tts_models/en/ljspeech/tacotron2-DDC"
        self.tts: Optional[TTS] = None

    def _lazy_load(self) -> None:
        if self.tts is None:
            self.tts = TTS(self.model_name)

    def synthesize_to_wav_bytes(self, text: str) -> bytes:
        self._lazy_load()
        assert self.tts is not None
        # Generate audio at 22.05kHz mono by default for this model
        wav = self.tts.tts(text)
        wav = np.asarray(wav, dtype=np.float32)
        buf = BytesIO()
        sf.write(buf, wav, 22050, format="WAV")
        return buf.getvalue()

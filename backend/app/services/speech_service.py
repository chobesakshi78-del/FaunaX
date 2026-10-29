"""
FAUNA-X: Speech Service Interface (Whisper Speech-to-Text & Symptom Extraction)
Handles audio file streams and delegates to the NLP and Speech pipelines.
"""
from typing import Dict, Any, Optional
from ml.speech.transcription import speech_pipeline

class SpeechService:
    @staticmethod
    def transcribe_and_extract_symptoms(
        audio_bytes: bytes,
        species: Optional[str] = None,
        language_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribes livestock voice note and extracts clinical symptoms."""
        return speech_pipeline.transcribe_and_extract(
            audio_bytes=audio_bytes,
            species=species,
            language_hint=language_hint
        )

    @staticmethod
    def parse_symptoms_from_text(text: str, species: Optional[str] = None) -> Dict[str, Any]:
        """Extracts structured symptoms directly from text notes."""
        return speech_pipeline.process_raw_text(text=text, species=species)

speech_service = SpeechService()

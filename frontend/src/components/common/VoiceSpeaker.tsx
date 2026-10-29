import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface VoiceSpeakerProps {
  textToSpeak: string;
  language?: 'en' | 'mr' | 'hi';
  buttonLabel?: string;
  className?: string;
}

export const VoiceSpeaker: React.FC<VoiceSpeakerProps> = ({
  textToSpeak,
  language,
  buttonLabel,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const targetLang = language || (i18n.language as 'en' | 'mr' | 'hi');

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getBestVoice = (lang: 'en' | 'mr' | 'hi'): { voice: SpeechSynthesisVoice | null; langCode: string } => {
    if (lang === 'mr') {
      // 1. Look for explicit Marathi voice
      const mrVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith('mr'));
      if (mrVoice) return { voice: mrVoice, langCode: 'mr-IN' };
      // 2. Fallback to Hindi voice for Devanagari phonetic reading on Windows
      const hiVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (hiVoice) return { voice: hiVoice, langCode: 'hi-IN' };
      return { voice: null, langCode: 'mr-IN' };
    } else if (lang === 'hi') {
      const hiVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith('hi'));
      return { voice: hiVoice || null, langCode: 'hi-IN' };
    } else {
      const enVoice = availableVoices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().startsWith('en'));
      return { voice: enVoice || null, langCode: 'en-IN' };
    }
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window) || !textToSpeak) return;

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
      }
    } else {
      window.speechSynthesis.cancel(); // Cancel any prior speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      const { voice, langCode } = getBestVoice(targetLang);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = langCode;
      utterance.rate = 0.9; // Clear rural pacing
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported || !textToSpeak) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleToggleSpeak}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
          isSpeaking
            ? 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse ring-2 ring-amber-500/30'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
        }`}
        aria-label={isSpeaking ? t('voice.stop') : t('voice.listen')}
        title={isSpeaking ? t('voice.stop') : t('voice.listen')}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span>{t('farmer.stopListening')}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>{buttonLabel || t('farmer.listenAdvice')}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default VoiceSpeaker;

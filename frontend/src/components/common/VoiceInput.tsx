import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, AlertCircle, Check, RotateCcw, Globe, Keyboard } from 'lucide-react';

interface VoiceInputProps {
  onTranscriptConfirmed: (transcript: string) => void;
  initialText?: string;
  className?: string;
}

// Window typing for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptConfirmed,
  initialText = '',
  className = ''
}) => {
  const { t, i18n } = useTranslation();

  // Explicit voice-input language selection
  const defaultLocale = i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
  const [selectedLocale, setSelectedLocale] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>(defaultLocale);

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [confirmedText, setConfirmedText] = useState(initialText);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (initialText !== undefined) {
      setConfirmedText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    // Keep locale aligned with active language if user has not overridden
    if (i18n.language === 'mr') setSelectedLocale('mr-IN');
    else if (i18n.language === 'hi') setSelectedLocale('hi-IN');
    else setSelectedLocale('en-IN');
  }, [i18n.language]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(t('voice.unsupportedBrowser'));
      return;
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = selectedLocale;

      recog.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recog.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setConfirmedText((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
        setInterimText(currentInterim);
      };

      recog.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(t('voice.micPermissionDenied'));
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`${t('common.error')}: ${event.error}`);
        }
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recog;
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore error on unmount
        }
      }
    };
  }, [selectedLocale, t]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimText('');
      setErrorMessage(null);
      try {
        recognitionRef.current.lang = selectedLocale;
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Recognition start error:', err);
      }
    }
  };

  const handleConfirm = () => {
    onTranscriptConfirmed(confirmedText);
  };

  const handleClear = () => {
    setConfirmedText('');
    setInterimText('');
    onTranscriptConfirmed('');
  };

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4 shadow-2xs ${className}`}>
      {/* Top Header: Status, Explicit Locale Selector, Record Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs font-bold text-slate-800">
              {isListening ? t('voice.speakNow') : t('voice.pressToRecord')}
            </span>
          </div>

          {/* Explicit Voice Locale Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-blue-600 ml-1.5" />
            <button
              type="button"
              onClick={() => setSelectedLocale('mr-IN')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                selectedLocale === 'mr-IN'
                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी (mr)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLocale('hi-IN')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                selectedLocale === 'hi-IN'
                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी (hi)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLocale('en-IN')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                selectedLocale === 'en-IN'
                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Record / Stop Toggle */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={!isSupported}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
            isListening
              ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse ring-4 ring-rose-500/20'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>{t('voice.stopRecording')}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>{t('voice.pressToRecord')}</span>
            </>
          )}
        </button>
      </div>

      {/* Live / Interim Voice Transcript Stream */}
      {interimText && (
        <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 italic font-medium animate-pulse">
          "{interimText}..."
        </div>
      )}

      {/* Error / Fallback Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">{errorMessage}</p>
            <p className="text-[11px] text-amber-800">
              {t('voice.fallbackTyping')}
            </p>
          </div>
        </div>
      )}

      {/* Confirmed / Editable Transcript Area (Typed Alternative) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('voice.transcriptConfirmed')}</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Unicode Devanagari & English Supported
          </span>
        </div>
        <textarea
          rows={3}
          value={confirmedText}
          onChange={(e) => setConfirmedText(e.target.value)}
          placeholder={t('report.notesPlaceholder')}
          className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y shadow-2xs"
        />
      </div>

      {/* Review, Edit, Clear and Confirm Controls */}
      {confirmedText && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.cancel')}</span>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('common.confirm')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

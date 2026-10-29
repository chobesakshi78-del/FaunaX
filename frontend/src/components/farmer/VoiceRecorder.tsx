import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Volume2, Info, CheckCircle2 } from 'lucide-react';
import VoiceInput from '../common/VoiceInput';

interface VoiceRecorderProps {
  onVoiceRecorded?: (blob: Blob | null, transcript: string) => void;
  onAudioRecorded?: (blob: Blob) => void;
  initialTranscript?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceRecorded,
  onAudioRecorded,
  initialTranscript = '',
}) => {
  const { t, i18n } = useTranslation();
  const [capturedTranscript, setCapturedTranscript] = useState(initialTranscript);

  React.useEffect(() => {
    if (initialTranscript !== undefined) {
      setCapturedTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  const handleTranscriptConfirmed = (transcript: string) => {
    setCapturedTranscript(transcript);
    if (onVoiceRecorded) {
      onVoiceRecorded(null, transcript);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-3xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed font-medium">
          <strong className="text-navy-950 font-bold">{t('report.voicePrompt')}: </strong>
          {i18n.language === 'mr'
            ? 'मराठी, हिंदी किंवा इंग्रजीत स्पष्ट बोला. नोंदवलेला मजकूर तपासून बदलता येईल.'
            : i18n.language === 'hi'
            ? 'मराठी, हिंदी या अंग्रेजी में स्पष्ट बोलें। दर्ज किए गए पाठ की समीक्षा एवं संपादन कर सकते हैं।'
            : 'Speak freely in Marathi, Hindi, or English. You can review and edit the recognized text before submitting.'}
        </div>
      </div>

      <VoiceInput
        onTranscriptConfirmed={handleTranscriptConfirmed}
        initialText={capturedTranscript}
      />

      {capturedTranscript && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('report.confirmTranscript')}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

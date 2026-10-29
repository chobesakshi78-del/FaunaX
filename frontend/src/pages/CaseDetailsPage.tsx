import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import AIResultCard from '../components/ai/AIResultCard';
import CaseTimeline from '../components/vet/CaseTimeline';
import RiskBadge from '../components/common/RiskBadge';
import VoiceSpeaker from '../components/common/VoiceSpeaker';
import CaseReportModal from '../components/common/CaseReportModal';

export default function CaseDetailsPage() {
  const { t, i18n } = useTranslation();
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const fetchCase = async () => {
      try {
        setLoading(true);
        const data = await api.getCaseById(caseId);
        setCaseData(data);
      } catch (err: any) {
        console.error('Error fetching case:', err);
        setError(err.response?.data?.detail || 'Failed to load case record');
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-950 mb-1">{t('farmer.noCases')}</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'The requested livestock case could not be located.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </div>
    );
  }

  // Find latest image and prediction
  const primaryImage = caseData.images && caseData.images.length > 0 ? caseData.images[0] : null;
  const primaryPrediction = (caseData.ai_predictions && caseData.ai_predictions.length > 0)
    ? caseData.ai_predictions[0]
    : (caseData.predictions && caseData.predictions.length > 0 ? caseData.predictions[0] : null);

  const getImageUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/?(uploads\/)?/, '');
    if (!cleanPath.startsWith('cases/')) {
      return `http://localhost:8000/uploads/cases/${cleanPath}`;
    }
    return `http://localhost:8000/uploads/${cleanPath}`;
  };

  const imageUrl = primaryImage ? getImageUrl(primaryImage.storage_path) : undefined;
  const vetAdvice = caseData.verification?.treatment_prescribed || caseData.verification?.clinical_findings;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('common.back')}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {caseData.case_number}
            </h1>
            <RiskBadge status={caseData.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t('common.date')}: {new Date(caseData.created_at).toLocaleString(i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Generate Clinical Health Report Button */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('report.generateReport')}</span>
          </button>

          {caseData.verification && (
            <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 ${
              caseData.verification.verification_status === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('common.status')}: {caseData.verification.verification_status}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Screening Card & Clinical Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Result Card */}
          <AIResultCard
            prediction={primaryPrediction}
            imageUrl={imageUrl}
          />

          {/* Veterinary Guidance & Prescription (with Voice Speaker) */}
          <div className="bg-emerald-50/80 rounded-3xl border border-emerald-200 p-6 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                {t('farmer.vetAdvice')}
              </h3>

              {vetAdvice && (
                <VoiceSpeaker textToSpeak={String(vetAdvice)} />
              )}
            </div>

            {vetAdvice ? (
              <p className="text-sm text-emerald-950 font-medium leading-relaxed whitespace-pre-wrap">
                {vetAdvice}
              </p>
            ) : (
              <p className="text-xs text-emerald-800 italic font-medium">
                {t('farmer.noAdviceYet')}
              </p>
            )}

            {caseData.verification && (
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold">
                {caseData.verification.sample_required && (
                  <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                    {t('vet.sampleRequired')}
                  </span>
                )}
                {caseData.verification.containment_required && (
                  <span className="px-2.5 py-0.5 bg-rose-200 text-rose-900 rounded-full">
                    {t('vet.quarantineAdvised')}
                  </span>
                )}
                {caseData.verification.treatment_prescribed && (
                  <span className="px-2.5 py-0.5 bg-blue-200 text-blue-900 rounded-full">
                    {t('vet.prescribedTreatment')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Animal Details & Clinical Profile */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-5">
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              {t('report.step2')} & {t('report.step1')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.species')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{caseData.species}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.sex')} / {t('farmer.ageMonths')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{caseData.sex || 'Unknown'} • {caseData.age || 'N/A'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.breed')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{caseData.breed || 'Indigen / Mixed'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('report.numberOfAffected')}</span>
                <p className="text-sm font-bold text-rose-600 mt-0.5">{caseData.number_affected}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-navy-950 block mb-2">{t('report.symptomsQuestion')}</span>
              <div className="flex flex-wrap gap-2">
                {caseData.symptoms && caseData.symptoms.length > 0 ? (
                  caseData.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl"
                    >
                      {s.symptom_name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">{t('common.none')}</span>
                )}
              </div>
            </div>

            {/* Farmer Notes */}
            {caseData.notes && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t('report.additionalNotes')}</span>
                  <VoiceSpeaker textToSpeak={caseData.notes} />
                </div>
                <p className="text-xs text-slate-800 font-medium">{caseData.notes}</p>
              </div>
            )}

            {/* History Details */}
            {caseData.history && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <span className="font-bold text-navy-950 block">{t('history.title')}:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium">
                  <div>• {t('history.vaccinationStatus')}: <strong className="text-navy-950">{caseData.history.vaccination_status || t('history.unknown')}</strong></div>
                  <div>• {t('history.recentDeaths')}: <strong className="text-navy-950">{caseData.history.recent_deaths ?? 0}</strong></div>
                  <div>• {t('history.recentMovement')}: <strong className="text-navy-950">{caseData.history.recent_movement ? t('history.yes') : t('history.no')}</strong></div>
                  <div>• {t('history.sharedGrazing')}: <strong className="text-navy-950">{caseData.history.contact_with_other_animals ? t('history.yes') : t('history.no')}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Location Card */}
        <div className="space-y-6">
          {/* Location Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {t('field.gpsCoordinates')}
            </h3>
            <div>
              <p className="text-sm font-bold text-navy-950">{caseData.location_name || caseData.village || 'Field Coordinates'}</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5 font-medium">
                {caseData.latitude ? `${caseData.latitude.toFixed(4)}° N, ${caseData.longitude?.toFixed(4)}° E` : 'Coordinates Recorded'}
              </p>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          <CaseTimeline caseItem={caseData} />
        </div>
      </div>

      {/* Multilingual Case Clinical Report Modal */}
      <CaseReportModal
        caseData={caseData}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}

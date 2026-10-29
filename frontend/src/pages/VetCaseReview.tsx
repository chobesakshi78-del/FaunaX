import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  Loader2, 
  AlertCircle,
  Globe,
  UserCheck,
  Send,
  Languages,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import AIResultCard from '../components/ai/AIResultCard';
import CaseTimeline from '../components/vet/CaseTimeline';
import VerificationPanel from '../components/vet/VerificationPanel';
import RiskBadge from '../components/common/RiskBadge';
import CaseReportModal from '../components/common/CaseReportModal';

export default function VetCaseReview() {
  const { t, i18n } = useTranslation();
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Translation states
  const [activeTab, setActiveTab] = useState<'ORIGINAL' | 'TRANSLATED'>('ORIGINAL');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Field Officer Assignment states
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | ''>('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignPriority, setAssignPriority] = useState('HIGH');
  const [isAssigning, setIsAssigning] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchCase = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const data = await api.getCaseById(caseId);
      setCaseData(data);

      // Check existing translations
      if (data.translations && data.translations.length > 0) {
        const enTrans = data.translations.find((tr: any) => tr.target_language === 'en');
        if (enTrans) {
          setTranslatedText(enTrans.translated_text);
        }
      }
    } catch (err: any) {
      console.error('Error fetching case:', err);
      setError(err.response?.data?.detail || 'Failed to load case record');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const data = await api.getFieldOfficers();
      setOfficers(data);
    } catch (err) {
      console.error('Error loading officers:', err);
    }
  };

  useEffect(() => {
    fetchCase();
    fetchOfficers();
  }, [caseId]);

  const handleTranslate = async (targetLang = 'en') => {
    if (!caseData) return;
    setIsTranslating(true);
    try {
      const res = await api.translateCase(caseData.id, targetLang);
      const notesTr = res.find((t: any) => t.field_name === 'voice_transcript' && t.target_language === targetLang);
      const symTr = res.find((t: any) => t.field_name === 'symptoms' && t.target_language === targetLang);
      const findingsTr = res.find((t: any) => t.field_name === 'clinical_findings' && t.target_language === targetLang);
      const txTr = res.find((t: any) => t.field_name === 'treatment_prescribed' && t.target_language === targetLang);

      const parts = [
        notesTr ? `${t('report.farmerStatement')}: ${notesTr.translated_text}` : null,
        symTr ? `${t('report.commonSymptoms')}: ${symTr.translated_text}` : null,
        findingsTr ? `${t('vet.clinicalFindings')}: ${findingsTr.translated_text}` : null,
        txTr ? `${t('vet.prescribedTreatment')}: ${txTr.translated_text}` : null,
      ].filter(Boolean);

      setTranslatedText(parts.join('\n\n') || notesTr?.translated_text || t('common.translated'));
      setActiveTab('TRANSLATED');
      setSuccessBanner(t('vet.translatedSubmission'));
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAssignOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !selectedOfficerId) return;
    setIsAssigning(true);
    try {
      await api.assignFieldOfficer(
        caseData.id,
        Number(selectedOfficerId),
        assignInstructions,
        assignPriority
      );
      setSuccessBanner(t('vet.fieldOfficerAssignedSuccess'));
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to assign field officer');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVerified = (verification: any) => {
    setSuccessBanner(t('vet.clinicalDiagnosisSuccess'));
    fetchCase();
  };

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
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-red-200 rounded-3xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-950 mb-1">Case Record Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'The requested case file is inaccessible.'}</p>
        <Link
          to="/vet/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </div>
    );
  }

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
  const sourceLang = (caseData as any).primary_language || 'mr';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div>
          <button
            onClick={() => navigate('/vet/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('common.back')}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {t('vet.clinicalAssessment')}: {caseData.case_number}
            </h1>
            <RiskBadge status={caseData.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(caseData.created_at).toLocaleString(i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('report.downloadPdf')}</span>
          </button>

          {caseData.verification && (
            <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('common.status')}: {caseData.verification.verification_status}
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Screening Card, Clinical Profile, Dual Language Viewer, Verification Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Result Card */}
          <AIResultCard
            prediction={primaryPrediction}
            imageUrl={imageUrl}
          />

          {/* Dual Language Farmer Observations Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-navy-950">
                  {t('vet.farmerReportLanguage')}: <span className="uppercase text-blue-700 font-mono font-extrabold">{sourceLang}</span>
                </h3>
              </div>

              {/* Translation Toggles & Action */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ORIGINAL')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'ORIGINAL'
                        ? 'bg-white text-navy-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('common.original')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!translatedText) handleTranslate('en');
                      else setActiveTab('TRANSLATED');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'TRANSLATED'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('common.translated')} (EN)
                  </button>
                </div>

                {!translatedText && (
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => handleTranslate('en')}
                    className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                    {t('vet.translateToEnglish')}
                  </button>
                )}
              </div>
            </div>

            {/* Content Display */}
            {activeTab === 'ORIGINAL' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('vet.originalSubmission')} ({sourceLang === 'mr' ? 'Marathi / मराठी' : sourceLang === 'hi' ? 'Hindi / हिंदी' : 'English'})
                </div>
                <p className="text-sm text-navy-950 font-medium whitespace-pre-wrap leading-relaxed">
                  {caseData.notes || (caseData as any).symptoms_raw || 'No custom descriptive notes recorded by farmer.'}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-1">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <span>{t('vet.translatedSubmission')}</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">Auto-Translated</span>
                </div>
                <p className="text-sm text-navy-950 font-medium whitespace-pre-wrap leading-relaxed">
                  {translatedText || 'Translation in progress...'}
                </p>
              </div>
            )}
          </div>

          {/* Clinical Profile & Symptoms */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-5">
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              {t('vet.patientData')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.species')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{t(`species.${caseData.species.toLowerCase()}`, caseData.species)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.sex')} / {t('farmer.ageMonths')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{t(`farmer.${(caseData.sex || '').toLowerCase()}`, caseData.sex || 'Unknown')} • {caseData.age || 'N/A'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('farmer.breed')}</span>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{caseData.breed || t('report.indigenous')}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('report.numberOfAffected')}</span>
                <p className="text-sm font-bold text-rose-600 mt-0.5">{caseData.number_affected} {caseData.number_affected > 1 ? t('report.affectedAnimals') : t('common.affected')}</p>
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
                  <span className="text-xs text-slate-400 italic">{t('vet.noSymptomsSpecified')}</span>
                )}
              </div>
            </div>

            {/* Epidemiological Context */}
            {caseData.history && (
              <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                <span className="font-bold text-navy-950 block">{t('vet.epidemiologicalRisk')}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium">
                  <div>• {t('history.vaccinationStatus')}: <strong className="text-navy-950">{caseData.history.vaccination_status || t('history.unknown')}</strong></div>
                  <div>• {t('history.recentDeathsLabel')}: <strong className="text-navy-950">{caseData.history.recent_deaths ?? 0}</strong></div>
                  <div>• {t('history.movementTitle')}: <strong className="text-navy-950">{caseData.history.recent_movement ? t('common.yes') : t('common.no')}</strong></div>
                  <div>• {t('history.grazingTitle')}: <strong className="text-navy-950">{caseData.history.contact_with_other_animals ? t('common.yes') : t('common.no')}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Verification Panel */}
          <VerificationPanel
            caseId={caseData.id}
            initialStatus={caseData.status}
            onVerified={handleVerified}
          />
        </div>

        {/* Right Col: Field Officer Assignment, Location & Lifecycle Timeline */}
        <div className="space-y-6">
          {/* Field Officer Assignment Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                {t('vet.assignFieldOfficer')}
              </span>
              {(caseData as any).assigned_officer_id && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {t('common.assigned')}
                </span>
              )}
            </div>

            <form onSubmit={handleAssignOfficer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('vet.selectOfficer')}</label>
                <select
                  required
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-950 focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="">{t('vet.chooseOfficer')}</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.full_name} ({off.district || 'District Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('common.priority')}</label>
                <select
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-950 focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="ROUTINE">{t('priority.low', 'Routine Follow-up')}</option>
                  <option value="HIGH">{t('priority.high', 'High Priority Inspection')}</option>
                  <option value="CRITICAL">{t('priority.critical', 'Critical Emergency Containment')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('vet.directivesInstructions')}</label>
                <textarea
                  rows={2}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder={t('vet.directivesPlaceholder')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-navy-950 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isAssigning || !selectedOfficerId}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{t('vet.scheduleInspection')}</span>
              </button>
            </form>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {t('vet.incidentCoordinates')}
            </h3>
            <div>
              <p className="text-sm font-bold text-navy-950">{caseData.location_name || 'Field Location'}</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {caseData.latitude.toFixed(4)}° N, {caseData.longitude.toFixed(4)}° E
              </p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-2xl text-xs text-slate-600 leading-relaxed border border-blue-100 font-medium">
              {t('vet.assignedDispensary')}: <strong className="text-blue-950">Nagpur Central Animal Health Center</strong>
            </div>
          </div>

          {/* Case Lifecycle Timeline */}
          <CaseTimeline caseItem={caseData} />
        </div>
      </div>

      {isReportOpen && (
        <CaseReportModal
          caseData={caseData}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}

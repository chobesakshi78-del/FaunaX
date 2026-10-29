import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  PlusCircle, Activity, Clock, CheckCircle, ShieldAlert, 
  ArrowRight, WifiOff, Tag, Shield, Volume2, MapPin, 
  ChevronRight, Calendar, AlertCircle, Sparkles, Check, X, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getPendingOfflineReports } from '../services/offlineDb';
import { CaseDetail, RiskTier } from '../types';
import { StatCard } from '../components/common/StatCard';
import RiskBadge, { CaseStatusBadge, LoadingState, EmptyState } from '../components/common/RiskBadge';
import VoiceSpeaker from '../components/common/VoiceSpeaker';
import CaseReportModal from '../components/common/CaseReportModal';

interface AnimalRecord {
  id: number;
  tag_number?: string;
  species: string;
  breed?: string;
  age_months?: number;
  sex?: string;
  herd_size: number;
  created_at: string;
}

export const FarmerDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'cases' | 'animals'>('cases');
  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOffline, setPendingOffline] = useState<number>(0);

  // Register Animal Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [tagNumber, setTagNumber] = useState('');
  const [species, setSpecies] = useState('Cattle');
  const [breed, setBreed] = useState('');
  const [ageMonths, setAgeMonths] = useState(24);
  const [sex, setSex] = useState('Female');
  const [herdSize, setHerdSize] = useState(1);
  const [submittingAnimal, setSubmittingAnimal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedCaseForReport, setSelectedCaseForReport] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [casesData, animalsRes] = await Promise.all([
        api.getCases(),
        fetch('/api/cases/animals/mine', { headers })
      ]);
      setCases(casesData);

      if (animalsRes.ok) {
        const aData = await animalsRes.json();
        setAnimals(aData);
      }

      const offline = await getPendingOfflineReports();
      setPendingOffline(offline.length);
    } catch (e) {
      console.error('Failed to load farmer data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterAnimalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAnimal(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
      const res = await fetch('/api/cases/animals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tag_number: tagNumber || undefined,
          species,
          breed: breed || undefined,
          age_months: Number(ageMonths),
          sex,
          herd_size: Number(herdSize)
        })
      });

      if (res.ok) {
        setSuccessMsg(t('farmer.animalRegisteredSuccess'));
        setIsRegisterOpen(false);
        setTagNumber('');
        setBreed('');
        await loadData();
        setActiveTab('animals');
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Error registering animal:', err);
    } finally {
      setSubmittingAnimal(false);
    }
  };

  const underReview = cases.filter((c) =>
    ['SUBMITTED', 'AI_SCREENING', 'VETERINARY_REVIEW'].includes(c.status)
  ).length;
  const verifiedCount = cases.filter((c) => c.status === 'VERIFIED' || c.status === 'RESPONSE_ACTIVE').length;
  const resolvedCount = cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6 pb-16 lg:pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>{t('farmer.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('farmer.welcome')}, {user?.full_name || 'Farmer'}
          </h1>
          <p className="text-xs text-blue-200/90 font-medium">
            {t('common.village')}: {user?.village || 'Field'}, {user?.district || 'Pune'} • {t('farmer.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Tag className="w-4 h-4 text-blue-300" />
            <span>{t('farmer.registerAnimal')}</span>
          </button>

          <Link
            to="/farmer/report"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('farmer.quickReport')}</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Offline Pending Banner */}
      {pendingOffline > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>{pendingOffline} {t('common.offlineNotice')}</strong>
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title={t('farmer.totalAnimals')} value={animals.length} icon={Tag} color="blue" />
        <StatCard title={t('farmer.activeCases')} value={underReview} icon={Clock} color="amber" />
        <StatCard title={t('status.verified')} value={verifiedCount} icon={ShieldAlert} color="rose" />
        <StatCard title={t('farmer.resolvedCases')} value={resolvedCount} icon={CheckCircle} color="emerald" />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'cases'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t('farmer.caseHistory')} ({cases.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('animals')}
          className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'animals'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t('farmer.myAnimalsTitle')} ({animals.length})
        </button>
      </div>

      {/* TAB 1: CASES */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-extrabold text-navy-950 uppercase tracking-wider">
              {t('farmer.caseHistory')}
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{cases.length} {t('common.records')}</span>
          </div>

          {loading ? (
            <LoadingState message={t('common.loading')} />
          ) : cases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Shield className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">{t('farmer.noCases')}</p>
              <Link
                to="/farmer/report"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('farmer.quickReport')}</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cases.map((c) => {
                const hasPrescription = c.verification?.treatment_prescribed;
                return (
                  <div key={c.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md">
                            {c.case_number}
                          </span>
                          <CaseStatusBadge status={c.status} />
                          <RiskBadge tier={c.ai_risk_tier as RiskTier} />
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.created_at).toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-1">
                          <span>{t(`species.${c.species.toLowerCase()}`, c.species)}</span>
                          {c.breed && <span className="text-slate-500 font-normal">({c.breed})</span>}
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">
                            {c.number_affected} {t('farmer.affected')}
                          </span>
                        </div>

                        {c.symptoms && c.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {c.symptoms.map((s, idx) => (
                              <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                                {s.symptom_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCaseForReport(c)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t('farmer.downloadReport')}</span>
                        </button>
                        <Link
                          to={`/cases/${c.id}`}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>{t('common.viewDetails')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Veterinary Advice Section with Voice Readout */}
                    {hasPrescription ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>{t('farmer.vetAdvice')}</span>
                          </div>
                          <VoiceSpeaker
                            textToSpeak={String(c.verification!.treatment_prescribed!)}
                            buttonLabel={t('farmer.listenAdvice')}
                          />
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-100">
                          {c.verification!.treatment_prescribed}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center justify-between">
                        <span>{t('farmer.noAdviceYet')}</span>
                        {c.assigned_officer && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            {t('farmer.fieldOfficerAssigned')}: {c.assigned_officer.full_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANIMALS */}
      {activeTab === 'animals' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-extrabold text-navy-950 uppercase tracking-wider">
              {t('farmer.myAnimalsTitle')}
            </h2>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('farmer.registerAnimal')}</span>
            </button>
          </div>

          {animals.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Tag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">{t('farmer.noAnimals')}</p>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('farmer.registerAnimal')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 sm:p-6">
              {animals.map((an) => (
                <div key={an.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {an.tag_number || `TAG-${an.id}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {an.sex ? (an.sex.toLowerCase() === 'female' ? t('farmer.female') : an.sex.toLowerCase() === 'male' ? t('farmer.male') : an.sex) : t('farmer.female')}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900">
                    {t(`species.${an.species.toLowerCase()}`, an.species)}
                    {an.breed && <span className="text-slate-500 font-normal"> • {an.breed}</span>}
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>{t('farmer.ageMonths')}: <strong>{an.age_months || 24}m</strong></span>
                    <span>{t('farmer.herdSize')}: <strong>{an.herd_size}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register Animal Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{t('farmer.registerAnimal')}</h3>
                <p className="text-xs text-slate-500 font-medium">{t('farmer.registerAnimalDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAnimalSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('farmer.tagNumber')} (Optional)
                </label>
                <input
                  type="text"
                  value={tagNumber}
                  onChange={(e) => setTagNumber(e.target.value)}
                  placeholder={t('farmer.tagPlaceholder')}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('farmer.species')}
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Cattle">{t('species.cattle')}</option>
                    <option value="Buffalo">{t('species.buffalo')}</option>
                    <option value="Goat">{t('species.goat')}</option>
                    <option value="Sheep">{t('species.sheep')}</option>
                    <option value="Pig">{t('species.pig')}</option>
                    <option value="Other">{t('species.other')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('farmer.breed')}
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Gir, Murrah, Osmanabadi"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('farmer.ageMonths')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('farmer.sex')}
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Female">{t('farmer.female')}</option>
                    <option value="Male">{t('farmer.male')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('farmer.herdSize')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={herdSize}
                    onChange={(e) => setHerdSize(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAnimal}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingAnimal ? t('common.submitting') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCaseForReport && (
        <CaseReportModal
          caseData={selectedCaseForReport}
          isOpen={!!selectedCaseForReport}
          onClose={() => setSelectedCaseForReport(null)}
        />
      )}
    </div>
  );
};

export default FarmerDashboard;

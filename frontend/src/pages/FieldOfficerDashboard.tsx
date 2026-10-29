import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ClipboardCheck, AlertTriangle, ShieldCheck, MapPin, Phone, 
  Clock, CheckCircle2, Search, Filter, Calendar, Stethoscope, 
  Activity, ArrowUpRight, Check, X, ShieldAlert, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CaseDetail, CasePriority, RiskTier } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import CaseReportModal from '../components/common/CaseReportModal';

export const FieldOfficerDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [stats, setStats] = useState<any>({
    assigned_to_me: 0,
    total_active_inspections: 0,
    urgent_priority_count: 0,
    pending_visits_count: 0,
    completed_visits_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Visit Modal State
  const [selectedCaseForVisit, setSelectedCaseForVisit] = useState<CaseDetail | null>(null);
  const [visitOutcome, setVisitOutcome] = useState('');
  const [visitObservations, setVisitObservations] = useState('');
  const [containmentStatus, setContainmentStatus] = useState('COMPLIANT');
  const [sampleCollected, setSampleCollected] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Escalation Modal State
  const [selectedCaseForEscalate, setSelectedCaseForEscalate] = useState<CaseDetail | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Dossier Report State
  const [selectedCaseForReport, setSelectedCaseForReport] = useState<any | null>(null);

  const fetchFieldData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [casesRes, statsRes] = await Promise.all([
        fetch('/api/field/cases', { headers }),
        fetch('/api/field/stats', { headers })
      ]);

      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setCases(casesData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching field officer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldData();
  }, []);

  const handleRecordVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForVisit) return;
    setSubmittingVisit(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
      const res = await fetch(`/api/field/cases/${selectedCaseForVisit.id}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visit_status: 'COMPLETED',
          observations: visitObservations || 'On-site clinical inspection completed.',
          outcome: visitOutcome || 'Farmer advised on containment and supportive care.',
          containment_status: containmentStatus,
          sample_collected: sampleCollected
        })
      });

      if (res.ok) {
        setSuccessBanner(t('field.visitRecordedSuccess', { caseNumber: selectedCaseForVisit.case_number }));
        setSelectedCaseForVisit(null);
        setVisitOutcome('');
        setVisitObservations('');
        await fetchFieldData();
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err) {
      console.error('Error recording visit:', err);
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForEscalate) return;
    setSubmittingEscalate(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
      const res = await fetch(`/api/field/cases/${selectedCaseForEscalate.id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: escalateReason || 'Rapid disease spread / high contagion risk observed in field.',
          priority: 'CRITICAL'
        })
      });

      if (res.ok) {
        setSuccessBanner(t('field.escalatedSuccess', { caseNumber: selectedCaseForEscalate.case_number }));
        setSelectedCaseForEscalate(null);
        setEscalateReason('');
        await fetchFieldData();
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err) {
      console.error('Error escalating case:', err);
    } finally {
      setSubmittingEscalate(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    // Mode filter
    if (filterMode === 'assigned' && c.assigned_officer_id !== user?.id) return false;
    if (filterMode === 'urgent' && !['CRITICAL', 'URGENT', 'HIGH'].includes((c.ai_triage_priority || '').toUpperCase())) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = c.case_number.toLowerCase().includes(q);
      const matchSpecies = c.species.toLowerCase().includes(q);
      const matchVillage = (c.village || '').toLowerCase().includes(q);
      const matchDistrict = (c.district || '').toLowerCase().includes(q);
      if (!matchNum && !matchSpecies && !matchVillage && !matchDistrict) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('roles.fieldOfficer')} • {user?.district || 'Pune District'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('field.title')}</h1>
          <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl font-medium">
            {t('field.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/clusters"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>{t('nav.mapSurveillance')}</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('field.assignedToMe')}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.assigned_to_me}</div>
          <div className="text-[11px] text-slate-500 font-medium">{t('field.assignedCases')}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('field.urgentCases')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{stats.urgent_priority_count}</div>
          <div className="text-[11px] text-rose-700 font-medium">{t('field.urgentAttentionNotice')}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('field.pendingVisits')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.pending_visits_count}</div>
          <div className="text-[11px] text-slate-500 font-medium">{t('field.pendingVisitsNotice')}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('field.completedVisits')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.completed_visits_count}</div>
          <div className="text-[11px] text-slate-500 font-medium">{t('field.completedVisitsNotice')}</div>
        </div>
      </div>

      {/* Cases Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t('common.all')} ({cases.length})
            </button>
            <button
              onClick={() => setFilterMode('assigned')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'assigned'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t('field.assignedToMe')} ({stats.assigned_to_me})
            </button>
            <button
              onClick={() => setFilterMode('urgent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {t('field.urgentCases')} ({stats.urgent_priority_count})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Case List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">{t('farmer.noCases')}</p>
            <p className="text-xs text-slate-400">{t('field.allInspectionsUpToDate')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCases.map((c) => {
              const isUrgent = ['CRITICAL', 'URGENT'].includes((c.ai_triage_priority || '').toUpperCase());
              return (
                <div key={c.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md">
                          {c.case_number}
                        </span>
                        <RiskBadge tier={c.ai_risk_tier as RiskTier} />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {t(`status.${c.status.toLowerCase()}`, c.status)}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('priority.critical')}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{t(`species.${c.species.toLowerCase()}`, c.species)}</span>
                        {c.breed && <span className="text-slate-500 font-normal">({c.breed})</span>}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-medium">
                          {c.number_affected} {c.number_affected > 1 ? t('field.affectedAnimals') : t('common.affected')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.village || 'Field Village'}, {c.district || 'Nagpur'}</span>
                        </div>
                        {c.farmer && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">{c.farmer.full_name}</span>
                            {c.farmer.phone && (
                              <a href={`tel:${c.farmer.phone}`} className="text-blue-600 hover:underline flex items-center gap-0.5">
                                <Phone className="w-3 h-3" />
                                {c.farmer.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Symptoms preview */}
                      {c.symptoms && c.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.symptoms.map((s, idx) => (
                            <span key={idx} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                              {s.symptom_name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Field Visits Status */}
                      {c.field_visits && c.field_visits.length > 0 && (
                        <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1 mt-2">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t('field.latestVisitOutcome')} ({String(t(`status.${(c.field_visits[c.field_visits.length - 1].visit_status || '').toLowerCase()}`, c.field_visits[c.field_visits.length - 1].visit_status))}):</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700">
                            {c.field_visits[c.field_visits.length - 1].outcome || c.field_visits[c.field_visits.length - 1].notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0 lg:w-48">
                      <button
                        type="button"
                        onClick={() => setSelectedCaseForVisit(c)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>{t('field.recordVisit')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCaseForReport(c)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t('report.downloadReport')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCaseForEscalate(c)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t('field.escalateEmergency')}</span>
                      </button>

                      <Link
                        to={`/cases/${c.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        <span>{t('common.viewDetails')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Visit Modal */}
      {selectedCaseForVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {t('field.recordVisit')} — {selectedCaseForVisit.case_number}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCaseForVisit.species} ({selectedCaseForVisit.village}, {selectedCaseForVisit.district})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForVisit(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordVisitSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('field.inspectionObservations')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={visitObservations}
                  onChange={(e) => setVisitObservations(e.target.value)}
                  placeholder={t('field.inspectionObservationsPlaceholder')}
                  className="w-full text-xs rounded-2xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('field.visitOutcome')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={visitOutcome}
                  onChange={(e) => setVisitOutcome(e.target.value)}
                  placeholder={t('field.visitOutcomePlaceholder')}
                  className="w-full text-xs rounded-2xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('field.containmentStatus')}
                  </label>
                  <select
                    value={containmentStatus}
                    onChange={(e) => setContainmentStatus(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="COMPLIANT">{t('field.containmentCompliant')}</option>
                    <option value="ADVISED">{t('field.containmentAdvised')}</option>
                    <option value="BREACHED">{t('field.containmentBreached')}</option>
                    <option value="NOT_REQUIRED">{t('field.containmentNotNeeded')}</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={sampleCollected}
                      onChange={(e) => setSampleCollected(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{t('field.sampleCollected')}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForVisit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingVisit ? t('common.submitting') : t('field.submitVisitReport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Escalation Modal */}
      {selectedCaseForEscalate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3>{t('field.escalateEmergency')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForEscalate(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-rose-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEscalateSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                {t('field.escalationWarning')}
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('field.escalateReason')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder={t('field.escalatePlaceholder')}
                  className="w-full text-xs rounded-2xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForEscalate(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingEscalate}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingEscalate ? t('common.submitting') : t('field.confirmEscalate')}
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

export default FieldOfficerDashboard;

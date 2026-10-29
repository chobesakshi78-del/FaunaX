import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Stethoscope, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  MapPin, 
  Activity, 
  Loader2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import StatCard from '../components/common/StatCard';
import RiskBadge from '../components/common/RiskBadge';

export default function VetDashboard() {
  const { t, i18n } = useTranslation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load vet cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const pendingCases = cases.filter(c => c.status === 'AI_SCREENED' || c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW');
  const verifiedCases = cases.filter(c => c.status === 'VERIFIED');
  const highPriorityCases = cases.filter(c => {
    const topPred = c.predictions?.[0];
    return topPred && topPred.prediction_class !== 'healthy' && (topPred.confidence_score || 0) >= 0.7;
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location_name && c.location_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') {
      return c.status === 'AI_SCREENED' || c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW';
    }
    if (statusFilter === 'VERIFIED') {
      return c.status === 'VERIFIED';
    }
    if (statusFilter === 'REJECTED') {
      return c.status === 'REJECTED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-950">{t('vet.title')}</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-full">
              Dr. Anjali Deshmukh, DVM ({t('vet.officerDesignation')})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('vet.subtitle')}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('vet.triageWorklist')}
          value={cases.length}
          subtitle={t('vet.allReports')}
          icon={<Stethoscope className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title={t('vet.pendingReview')}
          value={pendingCases.length}
          subtitle={t('vet.awaitingReview')}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          title={t('vet.highRiskCases')}
          value={highPriorityCases.length}
          subtitle={t('vet.confidenceHigh')}
          icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
          color="rose"
        />
        <StatCard
          title={t('vet.verifiedCount')}
          value={verifiedCases.length}
          subtitle={t('vet.confirmedRecords')}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
      </div>

      {/* Triage Worklist */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-navy-950 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">{t('common.filter')}:</span>
            {[
              { id: 'ALL', label: t('common.all') },
              { id: 'PENDING', label: t('vet.pendingReview') },
              { id: 'VERIFIED', label: t('status.verified') },
              { id: 'REJECTED', label: t('status.rejected') },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-navy-950">{t('common.noMatchingCases')}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('common.tryResetFilters')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCases.map((c) => {
              const topPred = c.predictions && c.predictions.length > 0 ? c.predictions[0] : null;
              const hasImage = c.images && c.images.length > 0;
              const dateLocale = i18n.language === 'mr' ? 'mr-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

              return (
                <div
                  key={c.id}
                  className="p-4 sm:p-5 hover:bg-blue-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-navy-950">{c.case_number}</span>
                      <RiskBadge status={c.status} />
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(c.created_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-navy-950">{t(`species.${c.species.toLowerCase()}`, { defaultValue: c.species })}</span> ({c.number_affected} {t('report.numberOfAffected')})
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {c.location_name || `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}`}
                      </div>
                    </div>

                    {/* Symptoms */}
                    {c.symptoms && c.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {c.symptoms.slice(0, 4).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                            {s.symptom_name}
                          </span>
                        ))}
                        {c.symptoms.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{c.symptoms.length - 4} {t('common.more')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Screening Indicator */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {topPred ? (
                      <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-200/80 flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700">
                            {t('vet.aiScreeningHeader')}
                          </div>
                          <div className="text-xs font-extrabold text-navy-950 capitalize">
                            {topPred.prediction_class.replace('_', ' ')} ({(topPred.confidence_score * 100).toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {hasImage ? t('vet.screeningProcessing') : t('aiScreening.noImage')}
                      </div>
                    )}

                    <Link
                      to={`/vet/cases/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap"
                    >
                      {t('common.viewDetails')}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

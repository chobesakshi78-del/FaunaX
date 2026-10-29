import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Stethoscope, 
  FileText, 
  Sparkles, 
  FlaskConical, 
  ClipboardCheck, 
  Syringe, 
  Languages, 
  MapPin,
  Calendar
} from 'lucide-react';
import { Case } from '../../types';

interface CaseTimelineProps {
  caseDetail?: Case;
  caseItem?: Case;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseDetail, caseItem }) => {
  const { t, i18n } = useTranslation();
  const [showTranslated, setShowTranslated] = useState(true);

  const c = caseDetail || caseItem;
  if (!c) return null;

  const currentLang = i18n.language as 'mr' | 'hi' | 'en';
  const locale = currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return t('timeline.pending');
    try {
      return new Date(dateStr).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return String(dateStr);
    }
  };

  const getTranslation = (fieldName: string) => {
    if (!c.translations) return null;
    const match = c.translations.find(
      (tr) => tr.field_name === fieldName && tr.target_language === currentLang
    );
    return match ? match.translated_text : null;
  };

  const preds = c.predictions || c.ai_predictions || [];
  const topPred = preds.length > 0 ? preds[0] : null;

  // Translated values
  const trSymptoms = getTranslation('symptoms');
  const trVoice = getTranslation('voice_transcript') || getTranslation('notes');
  const trTreatment = getTranslation('treatment_prescribed');
  const trFindings = getTranslation('clinical_findings');

  const events = [];

  // 1. Report Filed Event
  events.push({
    id: 'report_created',
    icon: FileText,
    iconColor: 'bg-blue-600 text-white',
    title: t('timeline.reported'),
    time: formatDate(c.created_at),
    status: t('timeline.completed'),
    statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
    content: (
      <div className="space-y-2 mt-1">
        <p className="text-xs text-slate-700 font-medium">
          {t('timeline.reportedDesc')}
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {t(`species.${c.species.toLowerCase()}`, c.species)} ({c.number_affected} {t('report.numberOfAffected')})
          </span>
          {c.location_name && (
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {c.location_name}
            </span>
          )}
        </div>

        {/* Symptoms */}
        {c.symptoms && c.symptoms.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              {t('report.step2')}:
            </span>
            <div className="flex flex-wrap gap-1">
              {c.symptoms.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold rounded-md"
                >
                  {s.symptom_name}
                </span>
              ))}
            </div>
            {showTranslated && trSymptoms && currentLang !== c.primary_language && (
              <p className="text-[11px] text-blue-900 bg-blue-50/70 p-2 rounded-xl mt-1.5 border border-blue-100">
                <span className="font-bold text-[10px] uppercase text-blue-700 block">
                  [{t('common.translated')}]:
                </span>
                {trSymptoms}
              </p>
            )}
          </div>
        )}

        {/* Farmer Statement */}
        {(c.voice_transcript || c.notes) && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
              {t('timeline.originalLanguage')} ({c.primary_language || 'mr'}):
            </span>
            <p className="italic font-medium">"{c.voice_transcript || c.notes}"</p>
            {showTranslated && trVoice && currentLang !== c.primary_language && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">
                  [{t('common.translated')}]:
                </span>
                <p className="text-blue-950 font-medium">"{trVoice}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  });

  // 2. AI Vision Screening Event
  events.push({
    id: 'ai_screening',
    icon: Sparkles,
    iconColor: topPred ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500',
    title: t('timeline.aiScreening'),
    time: topPred ? formatDate(topPred.created_at || c.created_at) : t('timeline.pending'),
    status: topPred ? t('timeline.completed') : t('timeline.pending'),
    statusColor: topPred ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200',
    content: topPred ? (
      <div className="space-y-1.5 mt-1 text-xs">
        <p className="text-slate-700 font-medium">{t('timeline.aiScreeningDesc')}</p>
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span className="text-indigo-950 capitalize">
              {topPred.prediction_class.replace('_', ' ')}
            </span>
            <span className="text-indigo-700 font-mono">
              {((topPred.confidence_score || topPred.confidence || 0) * 100).toFixed(0)}% {t('aiScreening.modelConfidence')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>{t('report.step5')}: <strong>{c.ai_risk_tier || 'LOW'}</strong></span>
            <span>•</span>
            <span>{t('priority.routine')}: <strong>{c.ai_triage_priority || 'ROUTINE'}</strong></span>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-xs text-slate-500 italic mt-1">{t('aiScreening.noImageDesc')}</p>
    )
  });

  // 3. Veterinary Verification Event
  const isVetReviewed = !!c.verification;
  events.push({
    id: 'vet_review',
    icon: Stethoscope,
    iconColor: isVetReviewed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500',
    title: t('timeline.vetReview'),
    time: isVetReviewed ? formatDate(c.verification?.verified_at || c.verification?.created_at) : t('timeline.inProgress'),
    status: isVetReviewed ? t('timeline.completed') : t('timeline.inProgress'),
    statusColor: isVetReviewed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
    content: isVetReviewed ? (
      <div className="space-y-2 mt-1 text-xs">
        <p className="text-slate-700 font-medium">{t('timeline.vetReviewDesc')}</p>
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
          {c.verification?.preliminary_diagnosis && (
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                {t('vet.preliminaryDiagnosis')}:
              </span>
              <p className="font-bold text-emerald-950 text-sm">{c.verification.preliminary_diagnosis}</p>
            </div>
          )}

          {c.verification?.clinical_findings && (
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                {t('vet.clinicalFindings')}:
              </span>
              <p className="text-slate-800 font-medium">{c.verification.clinical_findings}</p>
              {showTranslated && trFindings && (
                <p className="text-blue-950 font-medium bg-blue-50 p-2 rounded-lg mt-1 border border-blue-200">
                  <span className="text-[10px] font-bold uppercase text-blue-700 block">[{t('common.translated')}]:</span>
                  {trFindings}
                </p>
              )}
            </div>
          )}

          {c.verification?.treatment_prescribed && (
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                {t('vet.prescribedTreatment')}:
              </span>
              <p className="text-slate-800 font-medium">{String(c.verification.treatment_prescribed)}</p>
              {showTranslated && trTreatment && (
                <p className="text-blue-950 font-medium bg-blue-50 p-2 rounded-lg mt-1 border border-blue-200">
                  <span className="text-[10px] font-bold uppercase text-blue-700 block">[{t('common.translated')}]:</span>
                  {trTreatment}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
            {c.verification?.sample_required && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {t('vet.sampleRequired')}
              </span>
            )}
            {c.verification?.containment_required && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {t('vet.quarantineAdvised')}
              </span>
            )}
            {c.verification?.follow_up_date && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('status.followUp')}: {formatDate(c.verification.follow_up_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    ) : (
      <p className="text-xs text-slate-500 italic mt-1">{t('timeline.awaitingReview')}</p>
    )
  });

  // 4. Field Officer Inspections Event
  const fieldVisits = c.field_visits || [];
  events.push({
    id: 'field_inspections',
    icon: ClipboardCheck,
    iconColor: fieldVisits.length > 0 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500',
    title: t('timeline.fieldInspection'),
    time: fieldVisits.length > 0 ? formatDate(fieldVisits[fieldVisits.length - 1].scheduled_date) : t('timeline.scheduled'),
    status: fieldVisits.length > 0 ? t('timeline.completed') : t('timeline.scheduled'),
    statusColor: fieldVisits.length > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200',
    content: fieldVisits.length > 0 ? (
      <div className="space-y-2 mt-1 text-xs">
        <p className="text-slate-700 font-medium">{t('timeline.fieldInspectionDesc')}</p>
        <div className="space-y-2">
          {fieldVisits.map((fv: any, idx: number) => (
            <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span>{fv.officer?.full_name || t('roles.fieldOfficer')}</span>
                <span className="uppercase text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  {String(t(`status.${fv.visit_status?.toLowerCase()}`, { defaultValue: fv.visit_status }))}
                </span>
              </div>
              {fv.observations && (
                <p className="text-slate-800 font-medium">
                  <strong>{t('field.inspectionObservations')}:</strong> {fv.observations}
                </p>
              )}
              {fv.outcome && (
                <p className="text-slate-800 font-medium">
                  <strong>{t('field.visitOutcome')}:</strong> {fv.outcome}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
                {fv.containment_status && (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full">
                    {t('field.containmentStatus')}: {fv.containment_status}
                  </span>
                )}
                {fv.sample_collected && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {t('field.sampleCollected')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-xs text-slate-500 italic mt-1">{t('timeline.noFieldVisits')}</p>
    )
  });

  // 5. Diagnostic Laboratory Record Event
  const labRecords = c.lab_records || [];
  if (labRecords.length > 0) {
    events.push({
      id: 'lab_records',
      icon: FlaskConical,
      iconColor: 'bg-purple-600 text-white',
      title: t('timeline.labRecord'),
      time: formatDate(labRecords[0].collection_date),
      status: labRecords[0].status || t('timeline.completed'),
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      content: (
        <div className="space-y-2 mt-1 text-xs">
          <p className="text-slate-700 font-medium">{t('timeline.labRecordDesc')}</p>
          <div className="space-y-2">
            {labRecords.map((lr, idx) => (
              <div key={idx} className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-purple-950 font-mono">{lr.sample_id} ({lr.sample_type})</span>
                  <span className="text-purple-700">{lr.test_method}</span>
                </div>
                <p className="text-slate-700 font-medium">
                  {lr.lab_name} • {lr.confirmed_pathogen ? <strong className="text-rose-700">{lr.confirmed_pathogen}</strong> : t('timeline.pending')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    });
  }

  // 6. Case Resolution & Outcome
  const isResolved = ['RESOLVED', 'CLOSED'].includes(c.status);
  events.push({
    id: 'case_resolution',
    icon: CheckCircle2,
    iconColor: isResolved ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500',
    title: t('timeline.resolution'),
    time: isResolved ? formatDate(c.updated_at || c.created_at) : t('timeline.pending'),
    status: t(`status.${c.status.toLowerCase()}`, c.status),
    statusColor: isResolved ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-slate-100 text-slate-600 border-slate-200',
    content: (
      <div className="mt-1 text-xs">
        <p className="text-slate-600 font-medium">
          {isResolved ? t('timeline.resolutionDesc') : t('timeline.awaitingReview')}
        </p>
      </div>
    )
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-5">
      {/* Header with Title and Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {t('timeline.title')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {c.case_number} • {events.length} {t('common.records')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTranslated(!showTranslated)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            showTranslated
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{showTranslated ? t('common.showOriginal') : t('common.showTranslated')}</span>
        </button>
      </div>

      {/* Chronological Vertical Events */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((ev) => {
          const Icon = ev.icon;
          return (
            <div key={ev.id} className="relative">
              <div
                className={`absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${ev.iconColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-navy-950">
                    {ev.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ev.statusColor}`}>
                      {ev.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{ev.time}</span>
                  </div>
                </div>

                {ev.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseTimeline;

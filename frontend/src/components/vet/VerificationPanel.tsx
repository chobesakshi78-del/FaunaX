import React, { useState } from 'react';
import { CheckCircle, XCircle, ShieldCheck, Calendar, Activity, AlertOctagon, Send } from 'lucide-react';
import { api } from '../../services/api';
import { Case, CaseStatus } from '../../types';

interface VerificationPanelProps {
  caseDetail?: Case;
  caseId?: number | string;
  initialStatus?: CaseStatus;
  onVerified: (updatedCase: any) => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ 
  caseDetail, 
  caseId,
  initialStatus,
  onVerified 
}) => {
  const activeCaseId = Number(caseId || caseDetail?.id);
  const [statusAction, setStatusAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [findings, setFindings] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  const [sampleReq, setSampleReq] = useState(false);
  const [containmentReq, setContainmentReq] = useState(false);
  const [vaccinationReq, setVaccinationReq] = useState(false);
  const [treatmentReq, setTreatmentReq] = useState(true);
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) {
      alert('Please enter clinical assessment findings and observations before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        verification_status: statusAction,
        status: statusAction,
        clinical_findings: findings,
        assessment_notes: findings,
        severity,
        sample_required: sampleReq,
        containment_required: containmentReq,
        vaccination_required: vaccinationReq,
        treatment_required: treatmentReq,
        treatment_prescribed: treatmentReq,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        notes,
      };

      const updated = statusAction === 'VERIFIED'
        ? await api.verifyCase(activeCaseId, payload)
        : await api.rejectCase(activeCaseId, payload);

      onVerified(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-navy-950">Official Veterinary Verification</h3>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
          MVO-VERIFY
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Verification Action Decision */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Verification Decision *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatusAction('VERIFIED')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                statusAction === 'VERIFIED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Verify Diagnosis (Confirmed)</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusAction('REJECTED')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                statusAction === 'REJECTED'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs ring-1 ring-rose-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject / False Flag</span>
            </button>
          </div>
        </div>

        {/* Clinical Observations */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Clinical Observations & Diagnosis *
          </label>
          <textarea
            required
            rows={3}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Record clinical examination notes, lesion locations, mucosal state, and definitive diagnosis..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Observed Severity Level
          </label>
          <div className="flex gap-2">
            {['Mild', 'Moderate', 'Severe', 'Critical'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                  severity === s
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Required Interventions */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Interventions & Containment Directives
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-800 font-medium">
            <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
              <input
                type="checkbox"
                checked={treatmentReq}
                onChange={(e) => setTreatmentReq(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-navy-950">Treatment Prescribed</span>
            </label>

            <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
              <input
                type="checkbox"
                checked={containmentReq}
                onChange={(e) => setContainmentReq(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-navy-950">Herd Isolation / Quarantine</span>
            </label>

            <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
              <input
                type="checkbox"
                checked={sampleReq}
                onChange={(e) => setSampleReq(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-navy-950">Lab Sample Required</span>
            </label>

            <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
              <input
                type="checkbox"
                checked={vaccinationReq}
                onChange={(e) => setVaccinationReq(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-navy-950">Ring Vaccination Alert</span>
            </label>
          </div>
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Scheduled Follow-up Date (Optional)
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-navy-950 text-xs font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Saving Clinical Record...' : 'Submit Official Veterinary Assessment'}
        </button>
      </form>
    </div>
  );
};

export default VerificationPanel;

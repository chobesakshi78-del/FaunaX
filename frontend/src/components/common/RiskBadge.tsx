import React from 'react';
import { CaseStatus } from '../../types';

export interface RiskBadgeProps {
  status?: CaseStatus | string;
  tier?: string;
}

export const CaseStatusBadge: React.FC<RiskBadgeProps> = ({ status, tier }) => {
  const statusConfig: Record<string, { label: string; style: string }> = {
    SUBMITTED: { label: 'Submitted', style: 'bg-slate-100 text-slate-700 border-slate-300' },
    AI_SCREENING: { label: 'AI Screening', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' },
    AI_SCREENED: { label: 'AI Screened', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    UNDER_REVIEW: { label: 'Vet Review Required', style: 'bg-amber-50 text-amber-700 border-amber-300' },
    VETERINARY_REVIEW: { label: 'Vet Review Required', style: 'bg-amber-50 text-amber-700 border-amber-300' },
    VERIFIED: { label: 'Clinically Verified', style: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'Rejected / Resolved', style: 'bg-slate-100 text-slate-600 border-slate-300' },
    LAB_PENDING: { label: 'Lab Sampling', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    RESPONSE_ACTIVE: { label: 'Response Active', style: 'bg-rose-50 text-rose-700 border-rose-300' },
    FOLLOW_UP: { label: 'Follow-up Scheduled', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    RESOLVED: { label: 'Resolved', style: 'bg-emerald-100 text-emerald-900 border-emerald-400' },
    CLOSED: { label: 'Closed', style: 'bg-slate-100 text-slate-500 border-slate-200' },
    LOW: { label: 'Low Risk', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    MEDIUM: { label: 'Medium Risk', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    HIGH: { label: 'High Risk', style: 'bg-orange-50 text-orange-700 border-orange-200' },
    CRITICAL: { label: 'Critical Risk', style: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
  };

  const key = (tier || status || 'SUBMITTED').toString().toUpperCase();
  const conf = statusConfig[key] || { label: key, style: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.style}`}>
      {conf.label}
    </span>
  );
};

export const RiskBadge = CaseStatusBadge;

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading surveillance records...' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
    <span className="mt-3 text-xs font-semibold text-slate-600 tracking-wide">{message}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
    {icon && <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600 mb-3 border border-blue-100">{icon}</div>}
    <h3 className="text-sm font-bold text-navy-950">{title}</h3>
    <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default RiskBadge;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Mail, ArrowRight, ShieldAlert, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import LanguageSelector from '../components/common/LanguageSelector';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdminUtils, setShowAdminUtils] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo(role);
      if (role === 'FARMER') navigate('/farmer/dashboard');
      else if (role === 'VETERINARIAN') navigate('/vet/dashboard');
      else if (role === 'FIELD_OFFICER') navigate('/field/dashboard');
      else navigate('/government/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      <div className="max-w-xl w-full space-y-6">
        {/* Header & Language Bar */}
        <div className="text-center space-y-2">
          <div className="flex justify-end mb-1">
            <LanguageSelector variant="compact" />
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">{t('auth.portalAccess')}</h2>
          <p className="text-xs text-slate-500 font-medium">
            {t('auth.portalSubtitle')}
          </p>
        </div>

        {/* Exactly Three Primary Role Dashboards */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {t('auth.threeDashboards')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{t('auth.oneClickLogin')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* 1. Farmer Dashboard */}
            <button
              type="button"
              onClick={() => handleDemoClick('FARMER')}
              className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all group shadow-sm"
            >
              <div className="font-bold text-navy-950 flex items-center justify-between">
                <span>🌾 {t('roles.farmer')}</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">1</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">Ramesh Patil</div>
              <div className="text-[10px] text-slate-600 mt-1 leading-snug">{t('auth.farmerDesc')}</div>
            </button>

            {/* 2. Veterinarian Dashboard */}
            <button
              type="button"
              onClick={() => handleDemoClick('VETERINARIAN')}
              className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-all group shadow-sm"
            >
              <div className="font-bold text-navy-950 flex items-center justify-between">
                <span>🩺 {t('roles.veterinarian')}</span>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">2</span>
              </div>
              <div className="text-[11px] text-blue-700 font-bold mt-1">Dr. Anjali Deshmukh</div>
              <div className="text-[10px] text-slate-600 mt-1 leading-snug">{t('auth.vetDesc')}</div>
            </button>

            {/* 3. Field Officer Dashboard */}
            <button
              type="button"
              onClick={() => handleDemoClick('FIELD_OFFICER')}
              className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 hover:border-amber-500 hover:bg-amber-50 text-left transition-all group shadow-sm"
            >
              <div className="font-bold text-navy-950 flex items-center justify-between">
                <span>📋 {t('roles.fieldOfficer')}</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">3</span>
              </div>
              <div className="text-[11px] text-amber-700 font-bold mt-1">Sanjay Shinde</div>
              <div className="text-[10px] text-slate-600 mt-1 leading-snug">{t('auth.fieldDesc')}</div>
            </button>
          </div>

          {/* Preserved Administrative Utilities (Collapsible) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdminUtils(!showAdminUtils)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
            >
              <span>⚙️ {t('auth.adminUtilities')}</span>
              {showAdminUtils ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdminUtils && (
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-dashed border-slate-200 text-xs animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleDemoClick('DISTRICT_ADMIN')}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left"
                >
                  <div className="font-semibold text-slate-800 text-[10px]">District Surveillance</div>
                  <div className="text-[9px] text-slate-500">Pune HQ</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoClick('STATE_ADMIN')}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left"
                >
                  <div className="font-semibold text-slate-800 text-[10px]">State Epidemiology</div>
                  <div className="text-[9px] text-slate-500">MH Directorate</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoClick('NATIONAL_ADMIN')}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left"
                >
                  <div className="font-semibold text-slate-800 text-[10px]">National Authority</div>
                  <div className="text-[9px] text-slate-500">GIS & Telemetry</div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 space-y-4 shadow-card">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.emailAddress')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@faunax.gov.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{loading ? t('auth.authenticating') : t('auth.signInWithEmail')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

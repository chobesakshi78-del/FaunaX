import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Activity, LogOut, Wifi, WifiOff, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AIHealthStatus } from '../../types';
import LanguageSelector from './LanguageSelector';

export const Navbar: React.FC<{ toggleSidebar?: () => void }> = ({ toggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [aiHealth, setAiHealth] = useState<AIHealthStatus | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    api.getAIHealth().then(setAiHealth).catch(() => setAiHealth({ status: 'unavailable' }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!role) return '/';
    if (role === 'FARMER') return '/farmer/dashboard';
    if (role === 'VETERINARIAN') return '/vet/dashboard';
    if (role === 'FIELD_OFFICER') return '/field/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs transition-colors">
      <div className="flex items-center space-x-3">
        {user && toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-navy-950 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to={getDashboardLink()} className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-lg text-navy-950">
              FAUNA<span className="text-blue-600">-X</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-l border-slate-200 pl-2">
              DAHD Surveillance
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Multilingual Selector */}
        <LanguageSelector variant="header" />

        {/* Offline / Online indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">{t('common.online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-700 font-semibold">{t('common.offline')}</span>
            </>
          )}
        </div>

        {/* AI Engine Status */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-50/80 border border-blue-200/70">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600 font-medium">AI:</span>
          {aiHealth?.status === 'ready' ? (
            <span className="flex items-center text-blue-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              {aiHealth.device?.includes('NVIDIA') ? 'GPU' : 'Ready'}
            </span>
          ) : (
            <span className="text-slate-500">Standby</span>
          )}
        </div>

        {/* Auth / Profile */}
        {user ? (
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
            <Link
              to={getDashboardLink()}
              className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-bold text-navy-950 leading-tight">{user.full_name}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {role === 'FARMER' ? t('roles.farmer') : role === 'VETERINARIAN' ? t('roles.veterinarian') : t('roles.fieldOfficer')}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20"
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;

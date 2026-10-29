import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface LanguageOption {
  code: 'en' | 'mr' | 'hi';
  label: string;
  nativeLabel: string;
  badge: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', badge: 'EN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', badge: 'म' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', badge: 'हि' }
];

interface LanguageSelectorProps {
  variant?: 'header' | 'settings' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (code: 'en' | 'mr' | 'hi') => {
    // 1. Change active i18next language smoothly
    await i18n.changeLanguage(code);
    localStorage.setItem('faunax_lang', code);
    setIsOpen(false);

    // 2. If authenticated, persist to user profile in backend
    if (user) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('faunax_token');
        if (token) {
          await fetch('/api/auth/profile/language', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ preferred_language: code })
          });
        }
      } catch (err) {
        console.warn('Could not persist language to user profile:', err);
      }
    }
  };

  if (variant === 'settings') {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('common.selectLanguage')} / भाषा निवडा / भाषा चुनें
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                currentLang.code === lang.code
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{lang.nativeLabel}</span>
                {currentLang.code === lang.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 hover:border-blue-300 shadow-sm text-xs font-bold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label={t('common.selectLanguage')}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-extrabold text-blue-950">{currentLang.nativeLabel}</span>
        <span className="text-[10px] text-slate-400 font-medium">({currentLang.badge})</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in focus:outline-none">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('common.selectLanguage')}
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                currentLang.code === lang.code
                  ? 'bg-blue-50/80 text-blue-900 font-black'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                  {lang.badge}
                </span>
                <span>{lang.nativeLabel}</span>
              </div>
              {currentLang.code === lang.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

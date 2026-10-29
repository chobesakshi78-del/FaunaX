import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import mrTranslation from './locales/mr.json';
import hiTranslation from './locales/hi.json';

const savedLanguage = localStorage.getItem('faunax_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      mr: { translation: mrTranslation },
      hi: { translation: hiTranslation }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values safely
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('faunax_lang', lng);
  document.documentElement.lang = lng;
});

// Set document lang attribute on initial boot
document.documentElement.lang = savedLanguage;

export default i18n;

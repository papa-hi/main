import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import esTranslations from './locales/es.json';

// Get language from localStorage or default to Dutch
const savedLanguage = localStorage.getItem('language');
const defaultLanguage = savedLanguage || 'nl';

// Update HTML lang attribute to match the application language
export const updateDocumentLanguage = (language: string) => {
  document.documentElement.lang = language;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
        errors: enTranslations.errors,
        pwa: enTranslations.pwa,
        auth: enTranslations.auth,
        common: enTranslations.common
      },
      nl: {
        translation: nlTranslations,
        errors: nlTranslations.errors,
        pwa: nlTranslations.pwa,
        auth: nlTranslations.auth,
        common: nlTranslations.common
      },
      de: {
        translation: deTranslations,
        errors: deTranslations.errors,
        pwa: deTranslations.pwa,
        auth: deTranslations.auth,
        common: deTranslations.common
      },
      fr: {
        translation: frTranslations,
        errors: frTranslations.errors,
        pwa: frTranslations.pwa,
        auth: frTranslations.auth,
        common: frTranslations.common
      },
      es: {
        translation: esTranslations,
        errors: esTranslations.errors,
        pwa: esTranslations.pwa,
        auth: esTranslations.auth,
        common: esTranslations.common
      }
    },
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

// Set initial document language
updateDocumentLanguage(defaultLanguage);

// Update document language when the i18n language changes
i18n.on('languageChanged', (lng) => {
  updateDocumentLanguage(lng);
});

export default i18n;
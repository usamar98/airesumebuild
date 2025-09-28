import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export type Language = 'en' | 'fr' | 'it' | 'de' | 'ar';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language as Language;

  const changeLanguage = useCallback(
    (language: Language) => {
      i18n.changeLanguage(language);
      localStorage.setItem('i18nextLng', language);
    },
    [i18n]
  );

  const getCurrentLanguageInfo = useCallback(() => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    getCurrentLanguageInfo,
    languages,
    t,
  };
};
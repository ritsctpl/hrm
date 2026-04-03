import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { setCookie, destroyCookie, parseCookies } from 'nookies';

export function useLocalPreferences() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    (value: string) => {
      try {
        i18n.changeLanguage(value);
        localStorage.setItem('language', value);
        destroyCookie(null, 'language', { path: '/' });
        setCookie(null, 'language', value, {
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });
      } catch (error) {
        console.error('Error changing language:', error);
      }
    },
    [i18n]
  );

  const getCurrentLanguage = useCallback((): string => {
    const cookies = parseCookies();
    return cookies.language || 'en';
  }, []);

  return { changeLanguage, getCurrentLanguage };
}

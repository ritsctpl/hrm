
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { hindiLanguage } from "@utils/ln/hi";
import { englishLanguage } from "@utils/ln/en";
import { kannadaLanguage } from "@utils/ln/ka";
import { tamilLanguage } from "@utils/ln/ta";
import { parseCookies } from "nookies";

const resources = {
  en: {
    translation: englishLanguage
  },

  ka: { // Kannada
    translation: kannadaLanguage
  },
  ta: { // Tamil
    translation: tamilLanguage
  },
  hi: {
    translation: hindiLanguage
  }
};
const cookies = parseCookies();
      const language = cookies.language

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // lng: localStorage.getItem('language') || 'en',
    
    lng:language|| 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

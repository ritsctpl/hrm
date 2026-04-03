'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../molecules/LanguageSelector';
import CalendarSyncToggles from '../molecules/CalendarSyncToggles';
import ThemePresetGrid from '../molecules/ThemePresetGrid';
import DarkModeToggle from '../atoms/DarkModeToggle';
import { useTheme } from '@/components/ThemeContext';
import { useHrmSettingsStore } from '../../stores/hrmSettingsStore';
import { useLocalPreferences } from '../../hooks/useLocalPreferences';
import styles from '../../styles/HrmSettings.module.css';

const PreferencesSection: React.FC = () => {
  const { t } = useTranslation();
  const themeCtx = useTheme();
  const { hrmThemeKey, setHrmTheme } = themeCtx;
  const darkMode = (themeCtx as any).darkMode || false;
  const toggleDarkMode = (themeCtx as any).toggleDarkMode || (() => {});
  const { calendarSync, setCalendarSync } = useHrmSettingsStore();
  const { changeLanguage, getCurrentLanguage } = useLocalPreferences();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    setCurrentLang(lang);
  };

  return (
    <div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <SettingsIcon size={20} strokeWidth={1.5} />
          <div>
            <h2 className={styles.sectionTitle}>{t('settings.preferences.title')}</h2>
          </div>
        </div>

        <LanguageSelector currentLanguage={currentLang} onLanguageChange={handleLanguageChange} />

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.preferences.calendarSync')}</h4>
          <CalendarSyncToggles prefs={calendarSync} onToggle={setCalendarSync} />
        </div>

        <div className={styles.subSection}>
          <h4 className={styles.subSectionTitle}>{t('settings.preferences.theme')}</h4>
          <ThemePresetGrid activeThemeKey={hrmThemeKey} onThemeSelect={setHrmTheme} />
        </div>

        <div className={styles.subSection}>
          <DarkModeToggle checked={darkMode} onChange={toggleDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;

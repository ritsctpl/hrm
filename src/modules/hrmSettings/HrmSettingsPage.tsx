"use client";

import React from "react";
import CommonAppBar from "@/components/CommonAppBar";
import { useTheme } from "@/components/ThemeContext";
import { HRM_THEME_PRESETS, COLOR_PALETTE } from "@/config/hrmThemePresets";
import { Check, Palette, Sparkles } from "lucide-react";
import styles from "./styles/HrmSettings.module.css";

const HrmSettingsPage: React.FC = () => {
  const { hrmThemeKey, setHrmTheme } = useTheme();

  return (
    <div className="hrm-module-root">
      <CommonAppBar appTitle="Settings" />

      <div className={styles.settingsContent}>
        {/* Section 1: Curated Theme Presets */}
        <div className={styles.settingsCard}>
          <div className={styles.sectionHeader}>
            <Sparkles size={20} strokeWidth={1.5} />
            <div>
              <h2 className={styles.sectionTitle}>Curated Themes</h2>
              <p className={styles.sectionDesc}>
                Hand-picked color combinations. Click to apply instantly.
              </p>
            </div>
          </div>

          <div className={styles.themeGrid}>
            {HRM_THEME_PRESETS.map((preset) => {
              const isActive = hrmThemeKey === preset.key;
              return (
                <div
                  key={preset.key}
                  className={`${styles.themeCard} ${
                    isActive ? styles.themeCardActive : ""
                  }`}
                  onClick={() => setHrmTheme(preset.key)}
                >
                  <div
                    className={styles.themePreview}
                    style={{
                      background: `linear-gradient(135deg, ${preset.accentStart}, ${preset.accentEnd})`,
                    }}
                  >
                    {isActive && (
                      <div className={styles.checkmark}>
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <span className={styles.themeName}>{preset.name}</span>
                  <div className={styles.themeColors}>
                    <div
                      className={styles.colorDot}
                      style={{ background: preset.accentStart }}
                    />
                    <div
                      className={styles.colorDot}
                      style={{ background: preset.accentEnd }}
                    />
                  </div>
                  <div
                    className={styles.previewStrip}
                    style={{
                      background: `linear-gradient(90deg, ${preset.accentStart}, ${preset.accentEnd})`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Full Color Palette */}
        <div className={styles.settingsCard} style={{ marginTop: 24 }}>
          <div className={styles.sectionHeader}>
            <Palette size={20} strokeWidth={1.5} />
            <div>
              <h2 className={styles.sectionTitle}>Color Palette</h2>
              <p className={styles.sectionDesc}>
                Pick any color. AppBar, buttons, tabs, accents - everything changes.
              </p>
            </div>
          </div>

          <div className={styles.paletteGrid}>
            {COLOR_PALETTE.map((item) => {
              const isActive = hrmThemeKey === item.key;
              return (
                <div
                  key={item.key}
                  className={`${styles.paletteSwatch} ${
                    isActive ? styles.paletteSwatchActive : ""
                  }`}
                  onClick={() => setHrmTheme(item.key)}
                  title={item.name}
                >
                  <div
                    className={styles.swatchColor}
                    style={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.endColor})`,
                    }}
                  >
                    {isActive && (
                      <Check size={16} strokeWidth={2.5} color="#fff" />
                    )}
                  </div>
                  <span className={styles.swatchName}>{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Theme Indicator */}
        {hrmThemeKey && (
          <div className={styles.appliedMsg}>
            <Check size={14} strokeWidth={2} />
            <span>
              {(() => {
                const preset = HRM_THEME_PRESETS.find(
                  (p) => p.key === hrmThemeKey
                );
                if (preset) return `${preset.name} theme applied`;
                const palette = COLOR_PALETTE.find(
                  (p) => p.key === hrmThemeKey
                );
                if (palette) return `${palette.name} color applied`;
                return "Theme applied";
              })()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrmSettingsPage;

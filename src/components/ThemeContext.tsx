import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { parseCookies, setCookie } from "nookies";
import { getPresetByKey, STORAGE_KEY, DEFAULT_THEME_KEY, type HrmThemePreset } from "@/config/hrmThemePresets";

// Define the theme type
type ThemeType = {
  buttonColor: string;
  iconColor: string;
  tabColor: string;
  tabTextColor: string;
  textColor: string;
  backgroundColor: string;
  lineColor: string;
};

// Define default theme values
const DEFAULT_THEME: ThemeType = {
  buttonColor: "#124561",
  iconColor: "#124561",
  tabColor: "#124561",
  tabTextColor: "#666666",
  textColor: "#ffffff",
  backgroundColor: "#124561",
  lineColor: "#124561",
};

// Update the ThemeContextType to use ThemeType
interface ThemeContextType {
  themeData: ThemeType;
  setThemeData: React.Dispatch<React.SetStateAction<ThemeType>>;
  updateThemeFromSite: (newSiteDetails: any) => Promise<void>;
  hrmThemeKey: string;
  setHrmTheme: (presetKey: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProviderComponent = ({ children }) => {
  const [themeData, setThemeData] = useState(DEFAULT_THEME);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hrmThemeKey, setHrmThemeKey] = useState(DEFAULT_THEME_KEY);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('hrm-dark-mode', String(next)); } catch {}
      return next;
    });
  }, []);

  /**
   * Applies HRM theme preset CSS variables to :root
   */
  const applyHrmPreset = useCallback((preset: HrmThemePreset) => {
    if (!preset?.variables) return;
    Object.entries(preset.variables).forEach(([prop, value]) => {
      document.documentElement.style.setProperty(prop, value);
    });
  }, []);

  /**
   * Sets the HRM module theme, applies CSS variables, and persists to localStorage
   */
  const setHrmTheme = useCallback((presetKey: string) => {
    const preset = getPresetByKey(presetKey);
    setHrmThemeKey(preset.key);
    applyHrmPreset(preset);
    try {
      localStorage.setItem(STORAGE_KEY, preset.key);
    } catch {}
  }, [applyHrmPreset]);

  /**
   * Updates CSS custom properties in the document root based on current theme
   * @param theme - Current theme object containing color values
   */
  const updateCSSVariables = (theme) => {
    const cssVars = {
      "--icon-color": theme.iconColor,
      "--tab-active-color": theme.tabColor,
      "--tab-text-color": theme.tabTextColor,
      "--button-color": theme.buttonColor,
      "--text-color": theme.textColor,
      "--background-color": theme.backgroundColor,
      "--line-color": theme.lineColor,
    };

    Object.entries(cssVars).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  };

  /**
   * Updates theme based on site details and saves to cookies
   * Falls back to default theme if no valid theme data is provided
   * @param newSiteDetails - Site configuration containing theme information
   */
  const updateThemeFromSite = async (newSiteDetails: any) => {
    try {
      const theme = newSiteDetails?.theme?.background || "";
      const color = newSiteDetails?.theme?.color || "";
      const lineColor = newSiteDetails?.theme?.lineColor || "";

      if (!theme) {
        setThemeData(DEFAULT_THEME);
        setCookie(null, "themeData", JSON.stringify(DEFAULT_THEME), {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });
        return;
      }

      const defaultColor = "#124561";
      const newTheme = {
        buttonColor:
          theme === "#ffffff" ? color || defaultColor : theme || defaultColor,
        iconColor:
          theme === "#ffffff" ? color || defaultColor : theme || defaultColor,
        tabColor:
          theme === "#ffffff" ? color || defaultColor : theme || defaultColor,
        tabTextColor: "#666666",
        textColor: color || "#ffffff",
        backgroundColor: theme || defaultColor,
        lineColor: lineColor || "#ffffff",
      };

      setThemeData(newTheme);
      setCookie(null, "themeData", JSON.stringify(newTheme), {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch (error) {
      console.error("Error updating theme:", error);
      setThemeData(DEFAULT_THEME);
      setCookie(null, "themeData", JSON.stringify(DEFAULT_THEME), {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
  };

  // Modified initialization useEffect
  useEffect(() => {
    async function initializeTheme() {
      try {
        const cookies = parseCookies();
        const savedTheme = cookies.themeData
          ? JSON.parse(cookies.themeData)
          : null;

        if (savedTheme) {
          setThemeData(savedTheme);
          updateCSSVariables(savedTheme);
        } else {
          // COMMENTED OUT: Unnecessary API call - site details are fetched and theme is updated
          // by CommonAppBar component when site changes. This endpoint (/manufacturing/api/site/{site})
          // doesn't exist and returns 404. Theme updates are handled through updateThemeFromSite()
          // called from CommonAppBar with proper site details from fetchSiteAll().
          
          // const site = cookies.site;
          // if (site) {
          //   try {
          //     // If site exists in cookies but no theme, fetch site details
          //     const siteResponse = await fetch(`/manufacturing/api/site/${site}`); // Adjust this endpoint to match your API
          //     
          //     // Check if response is ok and is JSON
          //     if (siteResponse.ok) {
          //       const contentType = siteResponse.headers.get("content-type");
          //       if (contentType && contentType.includes("application/json")) {
          //         const siteDetails = await siteResponse.json();
          //         await updateThemeFromSite(siteDetails);
          //       } else {
          //         // Response is not JSON, use default theme
          //         console.warn("Site API returned non-JSON response, using default theme");
          //         setThemeData(DEFAULT_THEME);
          //         updateCSSVariables(DEFAULT_THEME);
          //       }
          //     } else {
          //       // API endpoint doesn't exist or returned error, use default theme
          //       console.warn(`Site API endpoint not found (${siteResponse.status}), using default theme`);
          //       setThemeData(DEFAULT_THEME);
          //       updateCSSVariables(DEFAULT_THEME);
          //     }
          //   } catch (fetchError) {
          //     // Fetch failed, use default theme
          //     console.warn("Failed to fetch site details, using default theme:", fetchError);
          //     setThemeData(DEFAULT_THEME);
          //     updateCSSVariables(DEFAULT_THEME);
          //   }
          // } else {
          //   // No site in cookies, use default theme
          //   setThemeData(DEFAULT_THEME);
          //   updateCSSVariables(DEFAULT_THEME);
          // }
          
          // Use default theme when no saved theme exists
          // The actual theme will be set by CommonAppBar when it loads site details
          setThemeData(DEFAULT_THEME);
          updateCSSVariables(DEFAULT_THEME);
        }
      } catch (error) {
        console.error("Error initializing theme:", error);
        setThemeData(DEFAULT_THEME);
        updateCSSVariables(DEFAULT_THEME);
      } finally {
        // Apply saved HRM module theme
        try {
          const savedHrmTheme = localStorage.getItem(STORAGE_KEY);
          if (savedHrmTheme) {
            const preset = getPresetByKey(savedHrmTheme);
            setHrmThemeKey(preset.key);
            applyHrmPreset(preset);
          }
        } catch {}
        try {
          const savedDarkMode = localStorage.getItem('hrm-dark-mode');
          if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch {}
        setIsInitialized(true);
      }
    }
    initializeTheme();
  }, [applyHrmPreset]);

  // Ensure CSS variables are updated whenever themeData changes
  // Then re-apply HRM theme on top so user's color choice takes precedence
  useEffect(() => {
    if (isInitialized) {
      updateCSSVariables(themeData);
      // Re-apply HRM theme on top of site theme so user's choice wins
      try {
        const savedKey = localStorage.getItem(STORAGE_KEY);
        if (savedKey) {
          const preset = getPresetByKey(savedKey);
          if (preset?.variables) {
            Object.entries(preset.variables).forEach(([prop, value]) => {
              document.documentElement.style.setProperty(prop, value);
            });
          }
        }
      } catch {}
    }
  }, [themeData, isInitialized]);

  // Ant Design theme configuration
  const antdThemeConfig = {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: themeData.buttonColor || "#124561", // Ensure fallback
    },
  };

  return (
    <ThemeContext.Provider
      value={{ themeData, setThemeData, updateThemeFromSite, hrmThemeKey, setHrmTheme, darkMode, toggleDarkMode }}
    >
      <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access theme context
 * @throws Error if used outside ThemeProvider
 * @returns ThemeContextType
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

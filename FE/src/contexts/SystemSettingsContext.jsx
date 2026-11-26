import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const DEFAULT_SETTINGS = {
  title: "VTicket",
  logoUrl: "",
  supportEmail: "",
  theme: "light",
  primaryColor: "#2563EB",
  defaultPageSize: 10,
  defaultLanguage: "vi",
};

const SystemSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const effectiveTheme =
    theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

  root.classList.toggle("dark", effectiveTheme === "dark");
  root.setAttribute("data-theme", effectiveTheme);
}

export function SystemSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await apiRequest("/settings");
      const data = response?.data ?? response;
      if (data && typeof data === "object") {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch {
      // Keep default settings if public settings endpoint is unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocalSettings = useCallback((partial) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    document.title = settings.title || "VTicket";
    document.documentElement.style.setProperty(
      "--primary-color",
      settings.primaryColor || "#2563EB"
    );
    applyThemeToDocument(settings.theme || "light");

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyThemeToDocument("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.title, settings.primaryColor, settings.theme]);

  return (
    <SystemSettingsContext.Provider
      value={{ settings, loading, refreshSettings, updateLocalSettings }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}

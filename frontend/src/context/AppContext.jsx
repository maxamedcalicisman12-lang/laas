import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import en from '../locales/en.json';
import so from '../locales/so.json';

const translations = { en, so };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1');
  const [locale, setLocaleState] = useState(() => localStorage.getItem('locale') || 'en');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#eab308');
  const [accentReady, setAccentReady] = useState(false);
  const [hasAccent, setHasAccent] = useState(() => !!localStorage.getItem('accentColor'));
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('default');
  const [flash, setFlash] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('dark', dark ? '1' : '0');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api
        .get('/settings')
        .then(({ data }) => {
          if (data.settings.accent_color) {
            setAccentColor(data.settings.accent_color);
            localStorage.setItem('accentColor', data.settings.accent_color);
            setHasAccent(true);
          }
          if (data.settings.font_size) setFontSize(data.settings.font_size);
          if (data.settings.font_family) setFontFamily(data.settings.font_family);
        })
        .catch(() => {})
        .finally(() => setAccentReady(true));
    } else {
      setAccentReady(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const sizes = { small: '0.875rem', medium: '1rem', large: '1.125rem' };
    document.documentElement.style.setProperty('--app-font-size', sizes[fontSize] || '1rem');
  }, [fontSize]);

  useEffect(() => {
    const families = {
      default: "'Instrument Sans', ui-sans-serif, system-ui, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'SFMono-Regular', Menlo, Consolas, monospace",
      rounded: "'Nunito', ui-rounded, 'Segoe UI', sans-serif",
    };
    document.documentElement.style.setProperty('--app-font-family', families[fontFamily] || families.default);
  }, [fontFamily]);

  const t = useCallback((key) => translations[locale]?.[key] ?? translations.en[key] ?? key, [locale]);

  const flashMessage = useCallback((type, message) => {
    setFlash({ type, message });
    window.clearTimeout(flashMessage._timer);
    flashMessage._timer = window.setTimeout(() => setFlash(null), 4000);
  }, []);

  const confirm = useCallback((message, action) => {
    setConfirmState({ message, action });
  }, []);

  return (
    <AppContext.Provider
      value={{
        dark,
        toggleDark: () => setDark((d) => !d),
        locale,
        setLocale: setLocaleState,
        accentColor,
        setAccentColor,
        accentReady,
        hasAccent,
        setHasAccent,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        t,
        flash,
        flashMessage,
        confirmState,
        confirm,
        closeConfirm: () => setConfirmState(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

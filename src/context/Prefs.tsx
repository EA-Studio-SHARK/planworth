import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy, type Copy, type Lang, type LangPref, type ThemePref } from "../i18n";
import { setLocaleLang } from "../lib/localize";

type ResolvedTheme = "light" | "dark";

type Prefs = {
  lang: Lang;
  langPref: LangPref;
  theme: ResolvedTheme;
  themePref: ThemePref;
  t: Copy;
  setLangPref: (pref: LangPref) => void;
  setThemePref: (pref: ThemePref) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

function detectLang(): Lang {
  const list = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  if (Array.from(list).some((item) => /^zh\b/i.test(item))) return "zh";
  if (list.length) return "en";
  return "zh";
}

function detectTheme(): ResolvedTheme {
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function readLangPref(): LangPref {
  try {
    const saved = localStorage.getItem("exploreai-lang");
    if (saved === "en" || saved === "zh" || saved === "auto") return saved;
  } catch {
    /* ignore */
  }
  return "auto";
}

function readThemePref(): ThemePref {
  try {
    const saved = localStorage.getItem("exploreai-theme");
    if (saved === "dark" || saved === "light" || saved === "auto") return saved;
  } catch {
    /* ignore */
  }
  return "auto";
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [langPref, setLangPrefState] = useState<LangPref>(readLangPref);
  const [themePref, setThemePrefState] = useState<ThemePref>(readThemePref);
  const [detectedLang, setDetectedLang] = useState<Lang>(detectLang);
  const [detectedTheme, setDetectedTheme] = useState<ResolvedTheme>(detectTheme);

  const lang: Lang = langPref === "auto" ? detectedLang : langPref;
  const theme: ResolvedTheme = themePref === "auto" ? detectedTheme : themePref;

  useEffect(() => {
    const onLang = () => setDetectedLang(detectLang());
    window.addEventListener("languagechange", onLang);
    return () => window.removeEventListener("languagechange", onLang);
  }, []);

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => setDetectedTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onTheme);
    return () => mq.removeEventListener("change", onTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("exploreai-theme", themePref);
    } catch {
      /* ignore */
    }
  }, [themePref]);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = "ExploreAI";
    try {
      localStorage.setItem("exploreai-lang", langPref);
    } catch {
      /* ignore */
    }
  }, [lang, langPref]);

  setLocaleLang(lang);

  const value = useMemo<Prefs>(
    () => ({
      lang,
      langPref,
      theme,
      themePref,
      t: copy[lang],
      setLangPref: setLangPrefState,
      setThemePref: setThemePrefState,
    }),
    [lang, langPref, theme, themePref],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}

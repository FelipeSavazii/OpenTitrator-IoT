import React, { createContext, useContext, useMemo, useEffect, useState } from "react";

type Messages = Record<string, string>;

const modules = import.meta.glob("../languages/*.json", { eager: true }) as Record<
  string,
  { default: Messages }
>;

const ALL_LOCALES: Record<string, Messages> = Object.fromEntries(
  Object.entries(modules).map(([p, mod]) => {
    const code = p.split("/").pop()!.replace(".json", "");
    return [code, mod.default];
  })
);

const FALLBACK_LOCALE = "en-US";

const RTL_PREFIXES = ["ar"]; // Arabic and other RTL languages can be added here
const isRtlLocale = (locale: string) => {
  const lower = locale.toLowerCase();
  return RTL_PREFIXES.some((p) => lower === p || lower.startsWith(p + "-"));
};

const DEFAULT_LOCALE = ALL_LOCALES[FALLBACK_LOCALE]
  ? FALLBACK_LOCALE
  : Object.keys(ALL_LOCALES)[0] ?? FALLBACK_LOCALE;

type LanguageOption = { code: string; language: string; icon?: string };

type I18nContextValue = {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: string) => string;
  availableLanguages: LanguageOption[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    const saved = localStorage.getItem("locale");
    if (saved && ALL_LOCALES[saved]) return saved;
    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    const dir = isRtlLocale(locale) ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", locale);
    document.body?.setAttribute("dir", dir);
  }, [locale]);

  const setLocale = (code: string) => {
    if (!ALL_LOCALES[code]) return;
    setLocaleState(code);
    localStorage.setItem("locale", code);
  };

  const t = (key: string) => {
    const current = ALL_LOCALES[locale] ?? {};
    const fallback = ALL_LOCALES[DEFAULT_LOCALE] ?? {};
    return current[key] ?? fallback[key] ?? key;
  };

  const availableLanguages = useMemo<LanguageOption[]>(() => {
    const arr = Object.entries(ALL_LOCALES).map(([code, msgs]) => ({
      code,
      language: msgs.language ?? code,
      icon: msgs.icon
    }));

    arr.sort((a, b) => {
      if (a.code === DEFAULT_LOCALE) return -1;
      if (b.code === DEFAULT_LOCALE) return 1;
      return a.language.localeCompare(b.language);
    });

    return arr;
  }, []);

  const value: I18nContextValue = { locale, setLocale, t, availableLanguages };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider />");
  return ctx;
}

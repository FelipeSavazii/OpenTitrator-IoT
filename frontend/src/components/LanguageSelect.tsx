import { useI18n } from "../i18n/i18n";

export function LanguageSelect() {
  const { locale, setLocale, availableLanguages } = useI18n();

  return (
    <select
      className="langSelect"
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      aria-label="Language selector"
    >
      {availableLanguages.map((l) => (
        <option key={l.code} value={l.code}>
          {l.icon ? `${l.icon} ` : ""}{l.language}
        </option>
      ))}
    </select>
  );
}

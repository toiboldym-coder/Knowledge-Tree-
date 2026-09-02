import { useAtlas } from "../state/AtlasContext";

export function LanguageSwitch() {
  const { lang, setLang } = useAtlas();
  return (
    <div className="flex items-center border border-white/10 text-[11px] uppercase tracking-[0.14em]">
      {(["en", "ru"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2 py-1.5 ${lang === code ? "bg-white/10 text-ivory" : "text-mist hover:text-ivory"}`}
          aria-pressed={lang === code}
          aria-label={code === "en" ? "English" : "Русский"}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

import { useI18n, LOCALE_LABELS, SUPPORTED_LOCALES } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SUPPORTED_LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={classNames(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            locale === item ? "bg-navy text-white shadow-soft" : "bg-white/80 text-slate-700"
          )}
        >
          {LOCALE_LABELS[item]}
        </button>
      ))}
    </div>
  );
}

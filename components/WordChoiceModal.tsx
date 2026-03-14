import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";

interface WordChoiceModalProps {
  open: boolean;
  options: string[];
  onSelect: (word: string) => Promise<void>;
  disabled: boolean;
}

export function WordChoiceModal({ open, options, onSelect, disabled }: WordChoiceModalProps) {
  const { t } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <Panel className="w-full max-w-2xl p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("yourTurn")}</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">{t("chooseWordTitle")}</h2>
        <p className="mt-3 text-slate-600">{t("chooseWordDescription")}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => void onSelect(option)}
              className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-6 text-left shadow-soft transition hover:-translate-y-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("option")}</p>
              <p className="mt-3 font-display text-3xl font-bold capitalize text-navy">{option}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

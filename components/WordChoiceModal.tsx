import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

interface WordChoiceModalProps {
  open: boolean;
  options: string[];
  onSelect: (word: string) => Promise<void>;
  disabled: boolean;
}

const CARD_ACCENTS = [
  { bg: "from-blue-50 to-indigo-50", ring: "ring-blue-200", label: "bg-blue-100 text-blue-700" },
  { bg: "from-teal-50 to-emerald-50", ring: "ring-teal-200", label: "bg-teal-100 text-teal-700" },
  { bg: "from-purple-50 to-pink-50", ring: "ring-purple-200", label: "bg-purple-100 text-purple-700" },
];

export function WordChoiceModal({ open, options, onSelect, disabled }: WordChoiceModalProps) {
  const { t } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 px-4 pb-4 backdrop-blur-md sm:items-center sm:pb-0">
      <Panel className="w-full max-w-2xl p-6 animate-pop-in sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-3xl">
            ✏️
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("yourTurn")}</p>
          <h2 className="mt-2 font-display text-3xl font-black text-navy sm:text-4xl">{t("chooseWordTitle")}</h2>
          <p className="mt-2 text-slate-500">{t("chooseWordDescription")}</p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {options.map((option, index) => {
            const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => void onSelect(option)}
                className={classNames(
                  "group relative overflow-hidden rounded-[22px] bg-gradient-to-br px-5 py-7 text-center ring-1 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60",
                  accent.bg,
                  accent.ring
                )}
              >
                <span className={classNames(
                  "mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                  accent.label
                )}>
                  {t("option")} {index + 1} / {options.length}
                </span>
                <p className={classNames(
                  "font-display font-black capitalize text-navy break-words",
                  option.length <= 8
                    ? "text-2xl sm:text-3xl"
                    : option.length <= 11
                      ? "text-xl sm:text-2xl"
                      : "text-lg sm:text-xl"
                )}>
                  {option}
                </p>
                <p className="mt-2 text-xs text-slate-400">{option.length} {t("lettersLabel")}</p>
                <div className="absolute inset-0 rounded-[22px] bg-white opacity-0 transition-opacity group-hover:opacity-10" />
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

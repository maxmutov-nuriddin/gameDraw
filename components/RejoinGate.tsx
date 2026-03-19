import Link from "next/link";

import { Panel } from "@/components/Panel";
import { useCountdown } from "@/hooks/useCountdown";
import { useI18n } from "@/hooks/useI18n";
import { REJOIN_WINDOW_MS } from "@/firebase/roomService";

interface RejoinGateProps {
  code: string;
  leftAt: number;
  onRejoin: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function RejoinGate({ code, leftAt, onRejoin, loading, error }: RejoinGateProps) {
  const { t } = useI18n();
  const deadline = leftAt + REJOIN_WINDOW_MS;
  const secondsLeft = useCountdown(deadline, 0);
  const expired = secondsLeft <= 0;

  const circumference = 2 * Math.PI * 44;
  const progress = expired ? 0 : secondsLeft / 60;
  const strokeDash = circumference * progress;

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <Panel className="w-full max-w-md p-7 animate-pop-in text-center">

        {/* Circular countdown */}
        <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
            {/* Background track */}
            <circle
              cx="56" cy="56" r="44"
              fill="none"
              stroke="rgba(16,37,66,0.08)"
              strokeWidth="7"
            />
            {/* Progress arc */}
            {!expired && (
              <circle
                cx="56" cy="56" r="44"
                fill="none"
                stroke={secondsLeft <= 15 ? "#ef4444" : secondsLeft <= 30 ? "#f59e0b" : "#0f9d8a"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s ease" }}
              />
            )}
          </svg>
          <div className="relative text-center">
            {expired ? (
              <span className="text-4xl">⛔</span>
            ) : (
              <>
                <p className="font-display text-3xl font-black text-navy leading-none">{secondsLeft}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">sec</p>
              </>
            )}
          </div>
        </div>

        {expired ? (
          <>
            <span className="mb-2 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-600">
              {t("rejoinWindow")}
            </span>
            <h1 className="mt-2 font-display text-2xl font-black text-navy">
              {t("rejoinExpiredTitle")}
            </h1>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
              {t("rejoinExpiredDesc")}
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex w-full justify-center">
              {t("backToHome")}
            </Link>
          </>
        ) : (
          <>
            <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
              {t("rejoinWindow")} · {t("roomLabel", { code })}
            </span>
            <h1 className="mt-2 font-display text-2xl font-black text-navy">
              {t("rejoinTitle")}
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              {t("rejoinDescription", { seconds: secondsLeft })}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() => void onRejoin()}
              className={`btn-primary mt-6 w-full justify-center ${
                secondsLeft <= 15 ? "animate-pulse-ring" : ""
              }`}
            >
              {loading ? t("rejoining") : `🔄 ${t("rejoinButton")}`}
            </button>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200 text-left">
                <span>⚠️</span>
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            <Link href="/" className="mt-4 block text-sm font-semibold text-slate-400 hover:text-slate-600 transition">
              {t("backToHome")}
            </Link>
          </>
        )}
      </Panel>
    </main>
  );
}

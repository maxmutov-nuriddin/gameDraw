import { useState } from "react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";

interface RoomGateProps {
  code: string;
  displayName: string;
  onNameChange: (value: string) => void;
  onJoin: (displayName: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function RoomGate({ code, displayName, onNameChange, onJoin, loading, error }: RoomGateProps) {
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const handleJoin = async () => {
    setSubmitting(true);

    try {
      await onJoin(displayName);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <Panel className="w-full max-w-xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("joinRoomLabel", { code })}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold text-navy">{t("joinRoomTitle")}</h1>
        <p className="mt-3 text-slate-600">{t("joinRoomDescription")}</p>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t("displayName")}</span>
          <input
            value={displayName}
            maxLength={18}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 outline-none transition focus:border-teal focus:bg-white"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={loading || submitting}
          className="mt-6 w-full rounded-2xl bg-navy px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("joinThisRoom")}
        </button>

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Panel>
    </main>
  );
}

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
      <Panel className="w-full max-w-md p-7 animate-pop-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-xl bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal">
            {t("joinRoomLabel", { code })}
          </span>
          <LanguageSwitcher />
        </div>
        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-3xl">
          🎮
        </div>
        <h1 className="mt-3 font-display text-3xl font-black text-navy sm:text-4xl">{t("joinRoomTitle")}</h1>
        <p className="mt-2 text-slate-500">{t("joinRoomDescription")}</p>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-bold text-slate-600">{t("displayName")}</span>
          <input
            value={displayName}
            maxLength={18}
            autoFocus
            onChange={(event) => onNameChange(event.target.value)}
            className="input-field"
            placeholder={t("displayNamePlaceholder")}
          />
        </label>

        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={loading || submitting}
          className="btn-primary mt-5 w-full"
        >
          {loading || submitting ? t("joining") : `🚀 ${t("joinThisRoom")}`}
        </button>

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200">
            <span>⚠️</span>
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </div>
        ) : null}
      </Panel>
    </main>
  );
}

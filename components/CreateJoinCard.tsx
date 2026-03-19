import { FormEvent, useState } from "react";

import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";

interface CreateJoinCardProps {
  displayName: string;
  onNameChange: (value: string) => void;
  onCreate: () => Promise<void>;
  onJoin: (code: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function CreateJoinCard({
  displayName,
  onNameChange,
  onCreate,
  onJoin,
  loading,
  error
}: CreateJoinCardProps) {
  const [roomCode, setRoomCode] = useState("");
  const { t } = useI18n();

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onJoin(roomCode);
  };

  return (
    <Panel className="p-6 md:p-8 animate-pop-in">
      {/* Name field */}
      <div className="mb-7">
        <label className="block">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{t("playerProfile")}</p>
          <p className="mb-3 text-sm font-semibold text-slate-600">{t("displayName")}</p>
          <input
            value={displayName}
            maxLength={18}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t("displayNamePlaceholder")}
            className="input-field text-base"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Create room */}
        <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: "rgba(16,37,66,0.04)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("createRoom")}</p>
            <p className="mt-1 text-base font-bold text-navy">{t("createRoomSubtitle")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("createRoomHelp")}</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onCreate()}
            className="btn-primary w-full"
          >
            {loading ? t("creating") : `🎮 ${t("createRoom")}`}
          </button>
        </div>

        {/* Join room */}
        <form
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{ background: "rgba(255,107,87,0.05)" }}
          onSubmit={handleJoin}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("joinRoom")}</p>
            <p className="mt-1 text-base font-bold text-navy">{t("joinRoomSubtitle")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("joinRoomHelp6Digit")}</p>
          </div>
          <input
            value={roomCode}
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, ""))}
            placeholder={t("roomCodePlaceholder")}
            className="input-field text-center text-xl font-black tracking-[0.3em]"
          />
          <button
            type="submit"
            disabled={loading || roomCode.length < 6}
            className="btn-coral w-full"
          >
            {loading ? t("joining") : `🚀 ${t("joinRoom")}`}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-5 animate-shake flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 ring-1 ring-rose-200">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      ) : null}
    </Panel>
  );
}

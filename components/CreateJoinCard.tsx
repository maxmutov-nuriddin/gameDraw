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
    <Panel className="mt-10 p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("playerProfile")}</p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">{t("displayName")}</span>
            <input
              value={displayName}
              maxLength={18}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t("displayNamePlaceholder")}
              className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 outline-none ring-0 transition focus:border-teal focus:bg-white"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onCreate()}
            className="w-full rounded-2xl bg-navy px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("createRoom")}
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleJoin}>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("joinFriend")}</p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">{t("roomCode")}</span>
            <input
              value={roomCode}
              maxLength={6}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="AB12CD"
              className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-lg uppercase tracking-[0.28em] outline-none transition focus:border-coral focus:bg-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-coral px-5 py-3 text-base font-semibold text-white transition hover:bg-[#ef593f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("joinRoom")}
          </button>
        </form>
      </div>

      {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </Panel>
  );
}

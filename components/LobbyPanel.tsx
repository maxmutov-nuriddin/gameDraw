import { MIN_PLAYERS } from "@/game/constants";
import type { PlayerDoc, RoomDoc } from "@/game/types";
import { getDisplayInitials } from "@/game/helpers";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/hooks/useI18n";
import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

interface LobbyPanelProps {
  room: RoomDoc;
  players: PlayerDoc[];
  currentUserId: string;
  onToggleReady: (ready: boolean) => Promise<void>;
  onStart: () => Promise<void>;
  onSetRoomLanguage: (language: Locale) => Promise<void>;
  starting: boolean;
}

export function LobbyPanel({
  room,
  players,
  currentUserId,
  onToggleReady,
  onStart,
  onSetRoomLanguage,
  starting
}: LobbyPanelProps) {
  const { t } = useI18n();
  const currentPlayer = players.find((player) => player.uid === currentUserId);
  const everyoneReady = players.filter((player) => !player.isHost).every((player) => player.isReady);
  const canStart = room.hostId === currentUserId && players.length >= MIN_PLAYERS && everyoneReady;

  return (
    <Panel className="p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("lobby")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("roomLabel", { code: room.code })}</h1>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal shadow-soft">
              {t("playersCounter", { count: players.length, max: room.maxPlayers })}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-slate-600">{t("lobbyHelp", { minPlayers: room.minPlayers })}</p>

          {room.hostId === currentUserId ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                {t("gameLanguage")}: {LOCALE_LABELS[room.language ?? "en"]}
              </p>
              <p className="text-sm text-slate-500">{t("gameLanguageHelp")}</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LOCALES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void onSetRoomLanguage(item)}
                    className={classNames(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      room.language === item ? "bg-navy text-white shadow-soft" : "bg-white text-slate-700"
                    )}
                  >
                    {LOCALE_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {room.hostId === currentUserId ? (
              <button
                type="button"
                disabled={!canStart || starting}
                onClick={() => void onStart()}
                className="rounded-2xl bg-navy px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("startMatch")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onToggleReady(!currentPlayer?.isReady)}
                className={classNames(
                  "rounded-2xl px-5 py-3 font-semibold transition",
                  currentPlayer?.isReady
                    ? "bg-white text-navy shadow-soft hover:bg-slate-50"
                    : "bg-coral text-white hover:bg-[#ef593f]"
                )}
              >
                {currentPlayer?.isReady ? t("cancelReady") : t("markReady")}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.uid}
              className="flex items-center gap-4 rounded-[22px] bg-white/80 px-4 py-4 shadow-soft"
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: player.color }}
              >
                {getDisplayInitials(player.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-navy">{player.displayName}</p>
                  {player.isHost ? (
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                      {t("host")}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">{player.isReady ? t("readyToPlay") : t("waitingInLobby")}</p>
              </div>
              <span
                className={classNames(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                  player.isReady || player.isHost
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {player.isHost ? t("ready") : player.isReady ? t("ready") : t("idle")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

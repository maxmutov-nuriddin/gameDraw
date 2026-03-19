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
  const nonHostPlayers = players.filter((player) => !player.isHost);
  const everyoneReady = nonHostPlayers.length === 0 || nonHostPlayers.every((player) => player.isReady);
  const canStart = room.hostId === currentUserId && players.length >= room.minPlayers && everyoneReady;
  const readyCount = players.filter((p) => p.isReady || p.isHost).length;

  return (
    <Panel className="p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: room info + controls */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t("lobby")}</p>
              <h1 className="mt-2 font-display text-3xl font-black text-navy sm:text-4xl">
                {t("roomLabel", { code: room.code })}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-2xl bg-teal/10 px-4 py-2 text-sm font-bold text-teal">
                <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                {players.length} / {room.maxPlayers} players
              </span>
              <span className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-soft">
                {readyCount}/{players.length} ready
              </span>
            </div>
          </div>

          <p className="mt-3 max-w-lg text-slate-500">
            {t("lobbyHelp", { minPlayers: room.minPlayers })}
          </p>

          {/* Language selector (host only) */}
          {room.hostId === currentUserId && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-bold text-slate-600">
                {t("gameLanguage")}: <span className="text-teal">{LOCALE_LABELS[room.language ?? "en"]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LOCALES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void onSetRoomLanguage(item)}
                    className={classNames(
                      "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                      room.language === item
                        ? "bg-navy text-white shadow-soft"
                        : "bg-white/80 text-slate-500 hover:bg-white hover:text-navy"
                    )}
                  >
                    {LOCALE_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {room.hostId === currentUserId ? (
              <button
                type="button"
                disabled={!canStart || starting}
                onClick={() => void onStart()}
                className={classNames(
                  "btn-primary text-base",
                  canStart ? "animate-pulse-ring" : ""
                )}
              >
                {starting ? t("starting") : `🚀 ${t("startMatch")}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onToggleReady(!currentPlayer?.isReady)}
                className={classNames(
                  "rounded-2xl px-6 py-3 text-base font-bold transition-all",
                  currentPlayer?.isReady
                    ? "bg-white text-slate-600 shadow-soft hover:bg-slate-50"
                    : "btn-coral"
                )}
              >
                {currentPlayer?.isReady ? `✓ ${t("cancelReady")}` : `✅ ${t("markReady")}`}
              </button>
            )}

            {!canStart && room.hostId === currentUserId && (
              <p className="text-sm text-slate-400">
                {players.length < room.minPlayers
                  ? t("needMorePlayers", { count: room.minPlayers - players.length })
                  : t("waitingForReady")}
              </p>
            )}
          </div>
        </div>

        {/* Right: player list */}
        <div
          className="space-y-2.5"
          data-scroll
          style={{ maxHeight: players.length > 7 ? "400px" : "auto", overflowY: players.length > 7 ? "auto" : "visible" }}
        >
          {players.map((player) => (
            <div
              key={player.uid}
              className={classNames(
                "flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all animate-slide-up",
                player.uid === currentUserId
                  ? "bg-teal/5 ring-1 ring-teal/25"
                  : "bg-white/80"
              )}
            >
              <div
                className="avatar-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white"
                style={{ backgroundColor: player.color }}
              >
                {getDisplayInitials(player.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={classNames(
                    "truncate font-bold",
                    player.uid === currentUserId ? "text-teal" : "text-navy"
                  )}>
                    {player.displayName}
                    {player.uid === currentUserId && <span className="ml-1 text-xs font-normal text-teal/60">{t("youLabel")}</span>}
                  </p>
                  {player.isHost && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
                      {t("host")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-400">
                  {player.isReady || player.isHost ? t("readyCheck") : t("waitingCheck")}
                </p>
              </div>
              <span
                className={classNames(
                  "h-3 w-3 rounded-full shadow-soft",
                  player.isReady || player.isHost
                    ? "bg-emerald-400"
                    : "bg-slate-200"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

import { REACTIONS } from "@/game/constants";
import type { PlayerDoc, RoomDoc, TurnDoc } from "@/game/types";
import { getDisplayInitials } from "@/game/helpers";
import { getLeaderboard } from "@/firebase/roomService";
import { useI18n } from "@/hooks/useI18n";
import { Panel } from "@/components/Panel";
import { classNames } from "@/utils/classNames";

interface PlayerSidebarProps {
  room: RoomDoc;
  turn: TurnDoc | null;
  players: PlayerDoc[];
  currentUserId: string;
  secondsLeft: number;
  onReaction: (reaction: string) => Promise<void>;
}

export function PlayerSidebar({
  room,
  turn,
  players,
  currentUserId,
  secondsLeft,
  onReaction
}: PlayerSidebarProps) {
  const { t } = useI18n();
  const leaderboard = getLeaderboard(players);
  const isLow = secondsLeft <= 15 && secondsLeft > 0 && room.status === "drawing";
  const isDanger = secondsLeft <= 8 && secondsLeft > 0 && room.status === "drawing";

  return (
    <div className="flex flex-col gap-4">
      {/* Timer + Round + Reactions */}
      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("round")}</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy">
              {room.round}<span className="text-lg text-slate-400">/{room.totalRounds}</span>
            </p>
          </div>
          <div
            className={classNames(
              "flex flex-col items-center justify-center rounded-2xl px-5 py-3 text-white shadow-soft transition-all duration-300",
              isDanger
                ? "timer-danger"
                : isLow
                  ? "bg-gradient-to-br from-amber-500 to-orange-500"
                  : "bg-gradient-to-br from-navy to-slate-700"
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{t("timer")}</p>
            <p className={classNames(
              "font-display font-bold leading-none transition-all",
              isDanger ? "text-4xl" : "text-3xl"
            )}>
              {secondsLeft}
              <span className="text-sm text-white/70">s</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => void onReaction(reaction)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-md active:scale-90"
            >
              {reaction}
            </button>
          ))}
        </div>
      </Panel>

      {/* Players list */}
      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("players")}</p>
        <div className="space-y-2" data-scroll style={{ maxHeight: players.length > 6 ? "340px" : "none", overflowY: players.length > 6 ? "auto" : "visible" }}>
          {players.map((player) => {
            const isDrawer = room.currentDrawerId === player.uid;
            const hasGuessed = turn?.guessedPlayerIds.includes(player.uid);
            const isMe = player.uid === currentUserId;
            return (
              <div
                key={player.uid}
                className={classNames(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all",
                  isDrawer
                    ? "bg-amber-50 ring-1 ring-amber-200"
                    : isMe
                      ? "bg-teal/5 ring-1 ring-teal/30"
                      : "bg-white/70"
                )}
              >
                <div
                  className="avatar-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {getDisplayInitials(player.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={classNames("truncate text-sm font-bold", isMe ? "text-teal" : "text-navy")}>
                      {player.displayName}
                      {isMe && <span className="ml-1 text-xs font-normal text-teal/70">{t("youLabel")}</span>}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {isDrawer && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        ✏️ {t("drawing")}
                      </span>
                    )}
                    {hasGuessed && !isDrawer && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        ✓ {t("solved")}
                      </span>
                    )}
                  </div>
                  {player.reaction && (
                    <p className="mt-0.5 animate-bounce-in text-xl leading-none">{player.reaction}</p>
                  )}
                </div>
                <p className="font-display text-2xl font-black text-navy tabular-nums">{player.score}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Leaderboard */}
      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("leaderboard")}</p>
        <div className="space-y-2">
          {leaderboard.slice(0, 8).map((player, index) => (
            <div
              key={player.uid}
              className={classNames(
                "flex items-center justify-between rounded-xl px-3 py-2",
                index === 0
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 ring-1 ring-amber-200"
                  : index === 1
                    ? "bg-slate-50 ring-1 ring-slate-200"
                    : index === 2
                      ? "bg-orange-50 ring-1 ring-orange-200"
                      : "bg-white/60"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={classNames(
                  "text-sm font-black",
                  index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-orange-400" : "text-slate-400"
                )}>
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </span>
                <p className={classNames(
                  "text-sm font-semibold",
                  player.uid === currentUserId ? "text-teal" : "text-navy"
                )}>
                  {player.displayName}
                </p>
              </div>
              <p className="font-display text-base font-bold text-slate-700 tabular-nums">
                {t("pointsShort", { score: player.score })}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

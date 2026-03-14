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

  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("round")}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy">
              {room.round}/{room.totalRounds}
            </p>
          </div>
          <div className="rounded-[22px] bg-navy px-5 py-4 text-center text-white shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{t("timer")}</p>
            <p className="mt-1 font-display text-4xl font-bold">{secondsLeft}s</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => void onReaction(reaction)}
              className="rounded-2xl bg-white px-4 py-2 text-2xl shadow-soft transition hover:-translate-y-0.5"
            >
              {reaction}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("players")}</p>
        <div className="mt-4 space-y-3">
          {players.map((player) => {
            const isDrawer = room.currentDrawerId === player.uid;
            const hasGuessed = turn?.guessedPlayerIds.includes(player.uid);
            return (
              <div
                key={player.uid}
                className={classNames(
                  "rounded-[22px] px-4 py-4 transition",
                  isDrawer ? "bg-sand" : "bg-white/80",
                  player.uid === currentUserId ? "ring-2 ring-teal/50" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: player.color }}
                  >
                    {getDisplayInitials(player.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-navy">{player.displayName}</p>
                      {isDrawer ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          {t("drawing")}
                        </span>
                      ) : null}
                      {hasGuessed ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          {t("solved")}
                        </span>
                      ) : null}
                    </div>
                    {player.reaction ? <p className="mt-1 text-2xl">{player.reaction}</p> : null}
                  </div>
                  <p className="font-display text-3xl font-bold text-navy">{player.score}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("leaderboard")}</p>
        <div className="mt-4 space-y-3">
          {leaderboard.map((player, index) => (
            <div key={player.uid} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
              <p className="font-semibold text-navy">
                #{index + 1} {player.displayName}
              </p>
              <p className="font-bold text-slate-700">{t("pointsShort", { score: player.score })}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

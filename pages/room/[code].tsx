import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { CanvasBoard } from "@/components/CanvasBoard";
import { ChatPanel } from "@/components/ChatPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LobbyPanel } from "@/components/LobbyPanel";
import { Panel } from "@/components/Panel";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import { RoomGate } from "@/components/RoomGate";
import { WordChoiceModal } from "@/components/WordChoiceModal";
import {
  clearCanvas,
  createStroke,
  joinRoom,
  resetRoom,
  selectWord,
  sendMessage,
  setRoomLanguage,
  setReaction,
  startGame,
  toggleReady
} from "@/firebase/roomService";
import { getLeaderboard } from "@/firebase/roomService";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useCountdown } from "@/hooks/useCountdown";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useDrawerHints } from "@/hooks/useDrawerHints";
import { useHostGameEngine } from "@/hooks/useHostGameEngine";
import { LOCALE_LABELS, useI18n } from "@/hooks/useI18n";
import { useRoomState } from "@/hooks/useRoomState";
import { formatRoomStatus, localizeErrorMessage } from "@/utils/i18n";

export default function RoomPage() {
  const router = useRouter();
  const code = typeof router.query.code === "string" ? router.query.code.replace(/\D/g, "") || null : null;
  const { user, loading: authLoading, error: authError } = useAnonymousAuth();
  const { displayName, setDisplayName } = useDisplayName();
  const { locale, t } = useI18n();
  const { room, players, turn, messages, strokes, privateState, loading, error } = useRoomState(code, user?.uid ?? null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const currentPlayer = players.find((player) => player.uid === user?.uid) ?? null;
  const leaderboard = useMemo(() => getLeaderboard(players), [players]);
  const secondsLeft = useCountdown(room?.turnEndsAt ?? null, 0);
  const intermissionSeconds = useCountdown(room?.intermissionEndsAt ?? null, 0);
  const isDrawer = room?.currentDrawerId === user?.uid;
  const canDraw =
    Boolean(isDrawer) &&
    room?.status === "drawing" &&
    Boolean(privateState?.selectedWord) &&
    room.currentTurnId === privateState?.turnId;
  const canGuess = Boolean(room && user && room.status === "drawing" && room.currentDrawerId !== user.uid);
  const canStart = Boolean(room && currentPlayer && room.hostId === currentPlayer.uid && players.length >= (room?.minPlayers ?? 2));

  useHostGameEngine({
    code,
    uid: user?.uid ?? null,
    room,
    turn,
    players,
    messages
  });

  useDrawerHints({
    code,
    uid: user?.uid ?? null,
    room,
    privateState
  });

  const withAction = async (label: string, task: () => Promise<void>) => {
    setBusyAction(label);
    setActionError(null);

    try {
      await task();
    } catch (taskError) {
      setActionError(localizeErrorMessage(locale, taskError instanceof Error ? taskError.message : t("errorGeneric")));
    } finally {
      setBusyAction(null);
    }
  };

  const handleJoinRoom = async (_nextDisplayName: string) => {
    if (!code || !user) {
      return;
    }

    await withAction("join", async () => {
      await joinRoom(code, user.uid, displayName);
    });
  };

  const handleStart = async () => {
    if (!code || !user) {
      return;
    }

    await withAction("start", async () => {
      await startGame(code, user.uid, players, room?.minPlayers, room?.maxPlayers);
    });
  };

  const handleSelectWord = async (word: string) => {
    if (!code || !user || !room?.currentTurnId) {
      return;
    }

    await withAction("select-word", async () => {
      await selectWord(code, user.uid, room.currentTurnId!, word);
    });
  };

  const handleSendMessage = async (message: string) => {
    if (!code || !room?.currentTurnId || !currentPlayer) {
      return;
    }

    await sendMessage(code, room.currentTurnId, currentPlayer, message);
  };

  const handleReaction = async (reaction: string) => {
    if (!code || !user) {
      return;
    }

    await setReaction(code, user.uid, reaction);
    window.setTimeout(() => {
      void setReaction(code, user.uid, null);
    }, 2800);
  };

  const handleClear = async () => {
    if (!code || !user) {
      return;
    }

    await clearCanvas(code, user.uid);
  };

  const handleStroke = async (stroke: {
    points: number[];
    color: string;
    size: number;
    tool: "brush" | "eraser";
    revision: number;
    seq: number;
  }) => {
    if (!code || !room?.currentTurnId || !user) {
      return;
    }

    await createStroke(code, room.currentTurnId, {
      drawerId: user.uid,
      ...stroke
    });
  };

  const handleReset = async () => {
    if (!code || !user) {
      return;
    }

    await withAction("reset", async () => {
      await resetRoom(code, user.uid, players);
    });
  };

  if (authLoading || loading) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
        <Panel className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-3xl">
            🎨
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("loadingRoom")}</p>
          <h1 className="mt-3 font-display text-3xl font-black text-navy">{t("connectingEveryone")}</h1>
          <p className="mt-2 text-slate-500">{t("loadingDescription")}</p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-teal animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Panel>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
        <Panel className="w-full max-w-md p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-500">{t("firebaseAuthError")}</p>
          <p className="mt-4 text-slate-700">{localizeErrorMessage(locale, authError)}</p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            {t("backHome")}
          </Link>
        </Panel>
      </main>
    );
  }

  if (!code || !room) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
        <Panel className="w-full max-w-md p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-500">{t("roomUnavailable")}</p>
          <p className="mt-4 text-slate-700">{localizeErrorMessage(locale, error) ?? t("roomCouldNotLoad")}</p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            {t("backHome")}
          </Link>
        </Panel>
      </main>
    );
  }

  if (!currentPlayer) {
    return (
      <>
        <Head>
          <title>{t("joinRoomLabel", { code })} | {t("appName")}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        </Head>
        <RoomGate
          code={code}
          displayName={displayName}
          onNameChange={setDisplayName}
          onJoin={handleJoinRoom}
          loading={busyAction === "join"}
          error={actionError}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t("roomLabel", { code })} | {t("appName")}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Head>

      <div className="page-shell min-h-screen">
        <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-8 lg:py-6">

          {/* Header */}
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition">
                  {t("backToHome")}
                </Link>
                <span className="text-slate-300">/</span>
                <h1 className="font-display text-xl font-black text-navy sm:text-2xl">
                  {t("roomLabel", { code: room.code })}
                </h1>
                <span className="rounded-xl bg-white/80 px-3 py-1 text-xs font-bold text-slate-500 shadow-soft">
                  {players.length}/{room.maxPlayers} 👥 {t("players")}
                </span>
                <span className={`rounded-xl px-3 py-1 text-xs font-bold shadow-soft ${
                  room.status === "drawing"
                    ? "bg-emerald-50 text-emerald-700"
                    : room.status === "choosing"
                      ? "bg-amber-50 text-amber-700"
                      : room.status === "round_end"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-white/80 text-slate-500"
                }`}>
                  {formatRoomStatus(locale, room.status)}
                </span>
                <span className="rounded-xl bg-white/80 px-3 py-1 text-xs font-semibold text-slate-400 shadow-soft">
                  {LOCALE_LABELS[room.language ?? "en"]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {room.hostId === currentPlayer.uid && room.status === "finished" ? (
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  disabled={busyAction === "reset"}
                  className="btn-primary"
                >
                  🔄 {t("playAgain")}
                </button>
              ) : null}
              <Link href="/" className="rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-soft transition hover:bg-white">
                {t("leaveRoom")}
              </Link>
            </div>
          </header>

          {/* Error banner */}
          {actionError ? (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200 animate-shake">
              <span>⚠️</span>
              <p className="text-sm font-semibold text-rose-700">{actionError}</p>
            </div>
          ) : null}

          {/* Lobby */}
          {room.status === "lobby" ? (
            <LobbyPanel
              room={room}
              players={players}
              currentUserId={currentPlayer.uid}
              onToggleReady={(ready) => toggleReady(code, currentPlayer.uid, ready)}
              onStart={handleStart}
              onSetRoomLanguage={(language) => withAction("room-language", () => setRoomLanguage(code, currentPlayer.uid, language))}
              starting={busyAction === "start" || !canStart}
            />
          ) : room.status === "finished" ? (
            /* Finished screen */
            <Panel className="p-6 md:p-10 animate-pop-in">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("matchComplete")}</p>
                <h2 className="mt-3 font-display text-4xl font-black text-navy sm:text-5xl">
                  {room.gameWinnerName ? `🏆 ${t("winnerTitle", { name: room.gameWinnerName })}` : t("gameOver")}
                </h2>
                <p className="mt-2 text-slate-500">{t("finishedDescription")}</p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.uid}
                    className={`relative overflow-hidden rounded-[22px] p-5 animate-slide-up ${
                      index === 0
                        ? "bg-gradient-to-br from-amber-50 to-yellow-100 ring-2 ring-amber-300"
                        : index === 1
                          ? "bg-gradient-to-br from-slate-50 to-gray-100 ring-1 ring-slate-200"
                          : index === 2
                            ? "bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-200"
                            : "bg-white/80 ring-1 ring-slate-100"
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <p className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}</p>
                    <div
                      className="avatar-ring mt-3 grid h-12 w-12 place-items-center rounded-xl text-sm font-black text-white"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="mt-2 font-display text-xl font-black text-navy">{player.displayName}</p>
                    <p className="mt-1 text-2xl font-black text-slate-700">{player.score}</p>
                    <p className="text-xs text-slate-400">{t("pointsLong", { score: player.score })}</p>
                    {player.uid === currentPlayer.uid && (
                      <span className="absolute right-3 top-3 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                        {t("youLabel")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          ) : (
            /* Game in progress */
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px] xl:grid-cols-[minmax(0,1.4fr)_360px]">
                <div className="flex flex-col gap-4">
                  <CanvasBoard
                    isDrawer={Boolean(isDrawer)}
                    canDraw={Boolean(canDraw)}
                    revision={room.canvasRevision}
                    status={room.status}
                    strokes={strokes}
                    maskedWord={room.maskedWord}
                    drawerWord={privateState?.selectedWord ?? null}
                    onStroke={handleStroke}
                    onClear={handleClear}
                  />
                  <ChatPanel
                    messages={messages}
                    turn={turn}
                    currentUserId={currentPlayer.uid}
                    canGuess={Boolean(canGuess)}
                    onSend={handleSendMessage}
                  />
                </div>

                <PlayerSidebar
                  room={room}
                  turn={turn}
                  players={players}
                  currentUserId={currentPlayer.uid}
                  secondsLeft={secondsLeft}
                  onReaction={handleReaction}
                />
              </div>

              {/* Round end banner */}
              {room.status === "round_end" ? (
                <Panel className="mt-4 p-5 animate-pop-in">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("roundRecap")}</p>
                      <h3 className="mt-1.5 font-display text-2xl font-black text-navy sm:text-3xl">
                        {room.firstCorrectId
                          ? `🎉 ${t("playerSolvedFirst", {
                              name: players.find((player) => player.uid === room.firstCorrectId)?.displayName ?? t("genericPlayer")
                            })}`
                          : `😅 ${t("nobodySolved")}`}
                      </h3>
                      <p className="mt-1 text-slate-500">{t("nextRoundSoon")}</p>
                    </div>
                    <div className="rounded-2xl bg-navy px-6 py-4 text-center text-white shadow-soft">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t("intermission")}</p>
                      <p className="mt-1 font-display text-4xl font-black">
                        {intermissionSeconds}<span className="text-xl text-white/60">s</span>
                      </p>
                    </div>
                  </div>
                </Panel>
              ) : null}

              <WordChoiceModal
                open={Boolean(
                  isDrawer &&
                  room.status === "choosing" &&
                  privateState?.turnId === room.currentTurnId &&
                  (privateState?.wordOptions?.length ?? 0) > 0
                )}
                options={privateState?.wordOptions ?? []}
                onSelect={handleSelectWord}
                disabled={busyAction === "select-word"}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

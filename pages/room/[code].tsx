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
import { MIN_PLAYERS } from "@/game/constants";
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
  const code = typeof router.query.code === "string" ? router.query.code.toUpperCase() : null;
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
  const canStart = Boolean(room && currentPlayer && room.hostId === currentPlayer.uid && players.length >= MIN_PLAYERS);

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
      await startGame(code, user.uid, players);
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
        <Panel className="w-full max-w-lg p-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("loadingRoom")}</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-navy">{t("connectingEveryone")}</h1>
          <p className="mt-3 text-slate-600">{t("loadingDescription")}</p>
        </Panel>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
        <Panel className="w-full max-w-lg p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-rose-500">{t("firebaseAuthError")}</p>
          <p className="mt-4 text-slate-700">{localizeErrorMessage(locale, authError)}</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-navy px-5 py-3 font-semibold text-white">
            {t("backHome")}
          </Link>
        </Panel>
      </main>
    );
  }

  if (!code || !room) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
        <Panel className="w-full max-w-lg p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-rose-500">{t("roomUnavailable")}</p>
          <p className="mt-4 text-slate-700">{localizeErrorMessage(locale, error) ?? t("roomCouldNotLoad")}</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-navy px-5 py-3 font-semibold text-white">
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page-shell min-h-screen">
        <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("realtimeGameRoom")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("roomLabel", { code: room.code })}</h1>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-soft">
                  {t("playersCounter", { count: players.length, max: room.maxPlayers })}
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-teal shadow-soft">
                  {formatRoomStatus(locale, room.status)}
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-soft">
                  {t("gameLanguage")}: {LOCALE_LABELS[room.language ?? "en"]}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <LanguageSwitcher />
              <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-700 shadow-soft">
                {t("leaveRoom")}
              </Link>
              {room.hostId === currentPlayer.uid && room.status === "finished" ? (
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  disabled={busyAction === "reset"}
                  className="rounded-2xl bg-navy px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
                >
                  {t("playAgain")}
                </button>
              ) : null}
              </div>
            </div>
          </header>

          {actionError ? (
            <Panel className="mb-6 p-4">
              <p className="text-sm text-rose-700">{actionError}</p>
            </Panel>
          ) : null}

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
            <Panel className="p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("matchComplete")}</p>
              <h2 className="mt-3 font-display text-5xl font-bold text-navy">
                {room.gameWinnerName ? t("winnerTitle", { name: room.gameWinnerName }) : t("gameOver")}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">{t("finishedDescription")}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {leaderboard.map((player, index) => (
                  <div key={player.uid} className="rounded-[24px] bg-white/80 p-5 shadow-soft">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">#{index + 1}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-navy">{player.displayName}</p>
                    <p className="mt-3 text-xl font-semibold text-slate-700">{t("pointsLong", { score: player.score })}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_340px] xl:grid-cols-[minmax(0,1.35fr)_380px]">
                <div className="grid gap-6">
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

              {room.status === "round_end" ? (
                <Panel className="mt-6 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("roundRecap")}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-3xl font-bold text-navy">
                        {room.firstCorrectId
                          ? t("playerSolvedFirst", {
                              name: players.find((player) => player.uid === room.firstCorrectId)?.displayName ?? t("genericPlayer")
                            })
                          : t("nobodySolved")}
                      </h3>
                      <p className="mt-2 text-slate-600">{t("nextRoundSoon")}</p>
                    </div>
                    <div className="rounded-[22px] bg-white px-5 py-4 text-center shadow-soft">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t("intermission")}</p>
                      <p className="mt-1 font-display text-4xl font-bold text-navy">
                        {intermissionSeconds}s
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

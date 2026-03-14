import { useEffect, useRef } from "react";

import {
  addSystemMessage,
  advanceRound,
  endRoundFromTimer,
  evaluateMessage,
  shouldEvaluateMessage
} from "@/firebase/roomService";
import type { MessageDoc, PlayerDoc, RoomDoc, TurnDoc } from "@/game/types";
import { buildRoundSummary } from "@/utils/i18n";

interface HostGameEngineOptions {
  code: string | null;
  uid: string | null;
  room: RoomDoc | null;
  turn: TurnDoc | null;
  players: PlayerDoc[];
  messages: MessageDoc[];
}

export function useHostGameEngine({
  code,
  uid,
  room,
  turn,
  players,
  messages
}: HostGameEngineOptions) {
  const processingMessageIds = useRef<Set<string>>(new Set());
  const postedRoundSummaryForTurn = useRef<string | null>(null);

  useEffect(() => {
    if (!code || !uid || !room || !turn || room.hostId !== uid) {
      return;
    }

    const nextMessage = messages.find((message) => {
      if (processingMessageIds.current.has(message.id)) {
        return false;
      }

      return shouldEvaluateMessage(room, turn, message);
    });

    if (!nextMessage) {
      return;
    }

    processingMessageIds.current.add(nextMessage.id);

    void evaluateMessage(code, room, turn, nextMessage).finally(() => {
      processingMessageIds.current.delete(nextMessage.id);
    });
  }, [code, messages, room, turn, uid]);

  useEffect(() => {
    if (!code || !uid || !room || room.hostId !== uid || room.status !== "drawing" || !room.turnEndsAt) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void endRoundFromTimer(code, uid);
    }, Math.max(room.turnEndsAt - Date.now(), 0) + 150);

    return () => window.clearTimeout(timeout);
  }, [code, room, uid]);

  useEffect(() => {
    if (
      !code ||
      !uid ||
      !room ||
      room.hostId !== uid ||
      room.status !== "round_end" ||
      !room.intermissionEndsAt
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void advanceRound(code, uid, room, players);
    }, Math.max(room.intermissionEndsAt - Date.now(), 0) + 150);

    return () => window.clearTimeout(timeout);
  }, [code, players, room, uid]);

  useEffect(() => {
    if (!code || !room?.currentTurnId || room.status !== "round_end") {
      postedRoundSummaryForTurn.current = null;
      return;
    }

    if (postedRoundSummaryForTurn.current === room.currentTurnId) {
      return;
    }

    postedRoundSummaryForTurn.current = room.currentTurnId;

    const winner = players.find((player) => player.uid === room.firstCorrectId);
    const summary = buildRoundSummary(room.language ?? "en", winner?.displayName);

    void addSystemMessage(code, room.currentTurnId, summary);
  }, [code, players, room]);
}

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import type {
  MessageDoc,
  PlayerDoc,
  PrivatePlayerDoc,
  RoomBundle,
  RoomDoc,
  StrokeDoc,
  TurnDoc
} from "@/game/types";
import { db } from "@/firebase/client";

export function useRoomState(code: string | null, uid: string | null): RoomBundle {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [turn, setTurn] = useState<TurnDoc | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [strokes, setStrokes] = useState<StrokeDoc[]>([]);
  const [privateState, setPrivateState] = useState<PrivatePlayerDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const roomCode = code;
    const roomDocRef = doc(db, "rooms", roomCode);
    const playerQuery = query(collection(db, "rooms", roomCode, "players"), orderBy("joinedAt", "asc"));
    const unsubscribers: Array<() => void> = [];

    const unsubscribeRoom = onSnapshot(
      roomDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Room not found.");
          setRoom(null);
          setLoading(false);
          return;
        }

        const roomData = snapshot.data() as RoomDoc;
        setRoom(roomData);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    const unsubscribePlayers = onSnapshot(playerQuery, (snapshot) => {
      setPlayers(
        snapshot.docs.map((item) => item.data() as PlayerDoc).sort((left, right) =>
          left.displayName.localeCompare(right.displayName)
        )
      );
    });

    unsubscribers.push(unsubscribeRoom, unsubscribePlayers);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [code]);

  useEffect(() => {
    if (!code || !room?.currentTurnId) {
      setTurn(null);
      setMessages([]);
      setStrokes([]);
      return;
    }

    const roomCode = code;
    const turnDocRef = doc(db, "rooms", roomCode, "turns", room.currentTurnId);
    const messageQuery = query(
      collection(db, "rooms", roomCode, "turns", room.currentTurnId, "messages"),
      orderBy("createdAt", "asc")
    );
    const strokeQuery = query(
      collection(db, "rooms", roomCode, "turns", room.currentTurnId, "strokes"),
      orderBy("seq", "asc")
    );

    const unsubscribeTurn = onSnapshot(turnDocRef, (snapshot) => {
      setTurn(snapshot.exists() ? (snapshot.data() as TurnDoc) : null);
    });

    const unsubscribeMessages = onSnapshot(messageQuery, (snapshot) => {
      setMessages(
        snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MessageDoc, "id">),
          id: item.id
        }))
      );
    });

    const unsubscribeStrokes = onSnapshot(strokeQuery, (snapshot) => {
      setStrokes(
        snapshot.docs.map((item) => ({
          ...(item.data() as Omit<StrokeDoc, "id">),
          id: item.id
        }))
      );
    });

    return () => {
      unsubscribeTurn();
      unsubscribeMessages();
      unsubscribeStrokes();
    };
  }, [code, room?.currentTurnId]);

  useEffect(() => {
    if (!code || !uid) {
      setPrivateState(null);
      return;
    }

    const privateDocRef = doc(db, "rooms", code, "private", uid);

    const unsubscribe = onSnapshot(privateDocRef, (snapshot) => {
      setPrivateState(snapshot.exists() ? (snapshot.data() as PrivatePlayerDoc) : null);
    });

    return () => unsubscribe();
  }, [code, uid]);

  return useMemo(
    () => ({
      room,
      players,
      turn,
      messages,
      strokes,
      privateState,
      loading,
      error
    }),
    [room, players, turn, messages, strokes, privateState, loading, error]
  );
}

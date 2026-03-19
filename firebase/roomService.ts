import {
  Timestamp,
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";

import {
  CHOOSING_SECONDS,
  DRAWER_POINTS,
  GUESS_POINTS,
  MAX_CHAT_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_BREAK_MS,
  ROUND_SECONDS,
  TOTAL_ROUNDS,
  WRONG_GUESS_PENALTY
} from "@/game/constants";
import { getAllTranslations } from "@/game/words";
import { getPlayerColor, maskWord, pickRandomWords, shuffle } from "@/game/helpers";
import type { MessageDoc, PlayerDoc, RoomDoc, TurnDoc } from "@/game/types";
import { db } from "@/firebase/client";
import { generateRoomCode } from "@/utils/code";
import { hashWord, normalizeWord } from "@/utils/hash";
import type { Locale } from "@/utils/i18n";

function roomRef(code: string) {
  return doc(db, "rooms", code);
}

function playerRef(code: string, uid: string) {
  return doc(db, "rooms", code, "players", uid);
}

function privateRef(code: string, uid: string) {
  return doc(db, "rooms", code, "private", uid);
}

function turnRef(code: string, turnId: string) {
  return doc(db, "rooms", code, "turns", turnId);
}

function messageCollectionRef(code: string, turnId: string) {
  return collection(db, "rooms", code, "turns", turnId, "messages");
}

function strokeCollectionRef(code: string, turnId: string) {
  return collection(db, "rooms", code, "turns", turnId, "strokes");
}

function makeTurnId() {
  return `turn-${Date.now()}`;
}

async function roomExists(code: string) {
  const snapshot = await getDoc(roomRef(code));
  return snapshot.exists();
}

async function reserveRoomCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();

    if (!(await roomExists(code))) {
      return code;
    }
  }

  throw new Error("Could not reserve a room code. Please try again.");
}

export const REJOIN_WINDOW_MS = 60 * 1000; // 1 minute

function toPlayerWrite(uid: string, displayName: string, isHost: boolean) {
  return {
    uid,
    displayName: displayName.trim(),
    isHost,
    isReady: false,
    score: 0,
    color: getPlayerColor(uid),
    reaction: null,
    leftAt: null,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function defaultRoom(code: string, hostId: string, language: Locale): RoomDoc {
  return {
    code,
    language,
    hostId,
    status: "lobby",
    round: 0,
    totalRounds: TOTAL_ROUNDS,
    maxPlayers: MAX_PLAYERS,
    minPlayers: MIN_PLAYERS,
    playerCount: 1,
    playerOrder: [],
    currentDrawerId: null,
    currentTurnId: null,
    currentWordHash: null,
    currentWordHashes: [],
    maskedWord: "",
    revealedLetterIndexes: [],
    choosingEndsAt: null,
    turnEndsAt: null,
    intermissionEndsAt: null,
    canvasRevision: 0,
    firstCorrectId: null,
    gameWinnerId: null,
    gameWinnerName: null
  };
}

function defaultTurn(turnId: string, drawerId: string, round: number): TurnDoc {
  return {
    turnId,
    drawerId,
    round,
    status: "choosing",
    guessedPlayerIds: [],
    firstCorrectId: null
  };
}

async function updatePlayersForNewGame(code: string, players: PlayerDoc[]) {
  const batch = writeBatch(db);

  players.forEach((player) => {
    batch.update(playerRef(code, player.uid), {
      isReady: false,
      score: 0,
      reaction: null,
      leftAt: null,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
}

export async function createRoom(uid: string, displayName: string, language: Locale = "en") {
  const trimmedName = displayName.trim();

  if (!trimmedName) {
    throw new Error("Add a display name before creating a room.");
  }

  const code = await reserveRoomCode();
  const batch = writeBatch(db);

  batch.set(roomRef(code), {
    ...defaultRoom(code, uid, language),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  batch.set(playerRef(code, uid), toPlayerWrite(uid, trimmedName, true));

  await batch.commit();

  return code;
}

export async function joinRoom(code: string, uid: string, displayName: string) {
  const normalizedCode = code.trim().replace(/\D/g, "");
  const roomSnapshot = await getDoc(roomRef(normalizedCode));

  if (!roomSnapshot.exists()) {
    throw new Error("Room not found.");
  }

  const room = roomSnapshot.data() as RoomDoc;
  const playerSnapshot = await getDoc(playerRef(normalizedCode, uid));

  if (!playerSnapshot.exists() && room.playerCount >= room.maxPlayers) {
    throw new Error("This room is full.");
  }

  const batch = writeBatch(db);

  if (playerSnapshot.exists()) {
    const existingPlayer = playerSnapshot.data() as PlayerDoc;
    const leftAt = existingPlayer.leftAt ?? null;

    if (leftAt !== null) {
      const elapsed = Date.now() - leftAt;
      if (elapsed > REJOIN_WINDOW_MS) {
        throw new Error("Rejoin window has expired.");
      }
      // Within rejoin window — restore player
      batch.update(playerRef(normalizedCode, uid), {
        displayName: displayName.trim(),
        leftAt: null,
        updatedAt: serverTimestamp()
      });
      batch.update(roomRef(normalizedCode), {
        playerCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } else {
      // Active player updating display name
      batch.update(playerRef(normalizedCode, uid), {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp()
      });
    }
  } else {
    batch.set(playerRef(normalizedCode, uid), toPlayerWrite(uid, displayName, false));
    batch.update(roomRef(normalizedCode), {
      playerCount: increment(1),
      updatedAt: serverTimestamp()
    });
  }

  await batch.commit();
  return normalizedCode;
}

export async function toggleReady(code: string, uid: string, ready: boolean) {
  await updateDoc(playerRef(code, uid), {
    isReady: ready,
    updatedAt: serverTimestamp()
  });
}

export async function leaveRoom(code: string, uid: string) {
  const playerSnapshot = await getDoc(playerRef(code, uid));

  if (!playerSnapshot.exists()) {
    return;
  }

  const player = playerSnapshot.data() as PlayerDoc;

  if (player.leftAt !== null) {
    // Already marked as left
    return;
  }

  const batch = writeBatch(db);

  batch.update(playerRef(code, uid), {
    leftAt: Date.now(),
    updatedAt: serverTimestamp()
  });

  batch.update(roomRef(code), {
    playerCount: increment(-1),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}

export async function setReaction(code: string, uid: string, reaction: string | null) {
  await updateDoc(playerRef(code, uid), {
    reaction,
    updatedAt: serverTimestamp()
  });
}

export async function setRoomLanguage(code: string, hostId: string, language: Locale) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data() as RoomDoc;

    if (room.hostId !== hostId) {
      throw new Error("Only the host can reset the room.");
    }

    if (room.status !== "lobby") {
      return;
    }

    transaction.update(roomRef(code), {
      language,
      updatedAt: serverTimestamp()
    });
  });
}

export async function createStroke(
  code: string,
  turnId: string,
  stroke: {
    drawerId: string;
    points: number[];
    color: string;
    size: number;
    tool: "brush" | "eraser";
    revision: number;
    seq: number;
  }
) {
  await addDoc(strokeCollectionRef(code, turnId), {
    ...stroke,
    createdAt: serverTimestamp()
  });
}

export async function clearCanvas(code: string, uid: string) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data() as RoomDoc;

    if (room.currentDrawerId !== uid || room.status !== "drawing") {
      return;
    }

    transaction.update(roomRef(code), {
      canvasRevision: (room.canvasRevision ?? 0) + 1,
      updatedAt: serverTimestamp()
    });
  });
}

export async function startGame(code: string, hostId: string, players: PlayerDoc[], roomMinPlayers = MIN_PLAYERS, roomMaxPlayers = MAX_PLAYERS) {
  if (players.length < roomMinPlayers || players.length > roomMaxPlayers) {
    throw new Error("Only the host can start the game.");
  }

  await updatePlayersForNewGame(code, players);

  const roomSnapshot = await getDoc(roomRef(code));

  if (!roomSnapshot.exists()) {
    throw new Error("Room not found.");
  }

  const room = roomSnapshot.data() as RoomDoc;

  if (room.hostId !== hostId) {
    throw new Error("Only the host can start the game.");
  }

  const order = shuffle(players.map((player) => player.uid));
  const turnId = makeTurnId();
  const drawerId = order[0];
  const batch = writeBatch(db);

  batch.update(roomRef(code), {
    status: "choosing",
    round: 1,
    playerOrder: order,
    currentDrawerId: drawerId,
    currentTurnId: turnId,
    currentWordHash: null,
    currentWordHashes: [],
    maskedWord: "",
    revealedLetterIndexes: [],
    choosingEndsAt: Date.now() + CHOOSING_SECONDS * 1000,
    turnEndsAt: null,
    intermissionEndsAt: null,
    canvasRevision: 0,
    firstCorrectId: null,
    gameWinnerId: null,
    gameWinnerName: null,
    playerCount: players.length,
    updatedAt: serverTimestamp()
  });

  batch.set(turnRef(code, turnId), {
    ...defaultTurn(turnId, drawerId, 1),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  batch.set(privateRef(code, drawerId), {
    turnId,
    wordOptions: pickRandomWords(3, room.language ?? "en"),
    selectedWord: null,
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}

export async function resetRoom(code: string, hostId: string, players: PlayerDoc[]) {
  const roomSnapshot = await getDoc(roomRef(code));

  if (!roomSnapshot.exists()) {
    throw new Error("Room not found.");
  }

  const room = roomSnapshot.data() as RoomDoc;

  if (room.hostId !== hostId) {
    throw new Error("Only the host can reset the room.");
  }

  const batch = writeBatch(db);

  batch.update(roomRef(code), {
    status: "lobby",
    round: 0,
    playerOrder: [],
    currentDrawerId: null,
    currentTurnId: null,
    currentWordHash: null,
    currentWordHashes: [],
    maskedWord: "",
    revealedLetterIndexes: [],
    choosingEndsAt: null,
    turnEndsAt: null,
    intermissionEndsAt: null,
    canvasRevision: 0,
    firstCorrectId: null,
    gameWinnerId: null,
    gameWinnerName: null,
    playerCount: players.length,
    updatedAt: serverTimestamp()
  });

  players.forEach((player) => {
    batch.update(playerRef(code, player.uid), {
      isReady: false,
      score: 0,
      reaction: null,
      leftAt: null,
      updatedAt: serverTimestamp()
    });

    batch.set(
      privateRef(code, player.uid),
      {
        turnId: null,
        wordOptions: [],
        selectedWord: null,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  });

  await batch.commit();
}

export async function selectWord(code: string, uid: string, turnId: string, word: string) {
  const wordHash = await hashWord(word);
  // Compute hashes for all language translations so any language is accepted
  const allTranslations = getAllTranslations(word);
  const allHashes = await Promise.all(allTranslations.map(hashWord));
  const endAt = Date.now() + ROUND_SECONDS * 1000;
  const batch = writeBatch(db);

  batch.set(
    privateRef(code, uid),
    {
      turnId,
      selectedWord: word,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  batch.update(roomRef(code), {
    status: "drawing",
    currentWordHash: wordHash,
    currentWordHashes: allHashes,
    maskedWord: maskWord(word),
    revealedLetterIndexes: [],
    choosingEndsAt: null,
    turnEndsAt: endAt,
    intermissionEndsAt: null,
    canvasRevision: 0,
    updatedAt: serverTimestamp()
  });

  batch.update(turnRef(code, turnId), {
    status: "drawing",
    updatedAt: serverTimestamp()
  });

  await batch.commit();
}

export async function revealHint(code: string, uid: string, word: string, nextIndexes: number[]) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data() as RoomDoc;

    if (room.currentDrawerId !== uid || room.status !== "drawing") {
      return;
    }

    if ((room.revealedLetterIndexes ?? []).length >= nextIndexes.length) {
      return;
    }

    transaction.update(roomRef(code), {
      revealedLetterIndexes: nextIndexes,
      maskedWord: maskWord(word, nextIndexes),
      updatedAt: serverTimestamp()
    });
  });
}

export async function sendMessage(
  code: string,
  turnId: string,
  player: Pick<PlayerDoc, "uid" | "displayName">,
  text: string
) {
  const trimmedText = text.trim().slice(0, MAX_CHAT_LENGTH);

  if (!trimmedText) {
    return;
  }

  await addDoc(messageCollectionRef(code, turnId), {
    playerId: player.uid,
    playerName: player.displayName,
    text: trimmedText,
    guessHash: await hashWord(trimmedText),
    isCorrect: false,
    rank: null,
    type: "guess",
    createdAt: serverTimestamp()
  });
}

export async function addSystemMessage(code: string, turnId: string, text: string) {
  await addDoc(messageCollectionRef(code, turnId), {
    playerId: "system",
    playerName: "Draw & Guess",
    text,
    guessHash: "",
    isCorrect: false,
    rank: null,
    type: "system",
    createdAt: serverTimestamp()
  });
}

export async function evaluateMessage(
  code: string,
  room: RoomDoc,
  turn: TurnDoc,
  message: MessageDoc
) {
  await runTransaction(db, async (transaction) => {
    const messageRef = doc(db, "rooms", code, "turns", turn.turnId, "messages", message.id);
    const messageSnapshot = await transaction.get(messageRef);
    const roomSnapshot = await transaction.get(roomRef(code));
    const turnSnapshot = await transaction.get(turnRef(code, turn.turnId));

    if (!roomSnapshot.exists() || !turnSnapshot.exists() || !messageSnapshot.exists()) {
      return;
    }

    const latestRoom = roomSnapshot.data() as RoomDoc;
    const latestTurn = turnSnapshot.data() as TurnDoc;
    const latestMessage = messageSnapshot.data() as MessageDoc;

    // Accept guess if it matches any of the stored hashes (any language)
    const validHashes: string[] = latestRoom.currentWordHashes?.length
      ? latestRoom.currentWordHashes
      : latestRoom.currentWordHash
        ? [latestRoom.currentWordHash]
        : [];
    const isCorrectGuess = validHashes.includes(latestMessage.guessHash);

    const isDrawer = latestMessage.playerId === latestTurn.drawerId;
    const alreadyGuessed = latestTurn.guessedPlayerIds.includes(latestMessage.playerId);

    if (
      latestRoom.status !== "drawing" ||
      latestTurn.status !== "drawing" ||
      latestMessage.evaluatedAt ||
      isDrawer ||
      alreadyGuessed
    ) {
      transaction.update(messageRef, { evaluatedAt: serverTimestamp() });
      return;
    }

    if (!isCorrectGuess) {
      // Wrong guess — apply penalty
      const penalizedPlayerRef = playerRef(code, latestMessage.playerId);
      const penalizedSnapshot = await transaction.get(penalizedPlayerRef);
      if (penalizedSnapshot.exists()) {
        const penalizedPlayer = penalizedSnapshot.data() as PlayerDoc;
        const newScore = Math.max(0, (penalizedPlayer.score ?? 0) - WRONG_GUESS_PENALTY);
        transaction.update(penalizedPlayerRef, { score: newScore, updatedAt: serverTimestamp() });
      }
      transaction.update(messageRef, { evaluatedAt: serverTimestamp() });
      return;
    }

    // The host processes scoring in a transaction so simultaneous correct guesses stay ordered.
    const rank = latestTurn.guessedPlayerIds.length;
    const points = GUESS_POINTS[rank] ?? GUESS_POINTS[GUESS_POINTS.length - 1];
    const playerToRewardRef = playerRef(code, latestMessage.playerId);
    const drawerRewardRef = playerRef(code, latestTurn.drawerId);
    const guessedPlayerIds = [...latestTurn.guessedPlayerIds, latestMessage.playerId];
    const firstCorrectId = latestTurn.firstCorrectId ?? latestMessage.playerId;

    transaction.update(playerToRewardRef, {
      score: increment(points),
      updatedAt: serverTimestamp()
    });

    if (rank === 0) {
      transaction.update(drawerRewardRef, {
        score: increment(DRAWER_POINTS),
        updatedAt: serverTimestamp()
      });
    }

    transaction.update(turnRef(code, turn.turnId), {
      guessedPlayerIds,
      firstCorrectId,
      updatedAt: serverTimestamp()
    });

    transaction.update(messageRef, {
      isCorrect: true,
      rank: rank + 1,
      evaluatedAt: serverTimestamp()
    });

    transaction.update(roomRef(code), {
      firstCorrectId,
      updatedAt: serverTimestamp()
    });

    const everyoneGuessed = guessedPlayerIds.length >= Math.max(latestRoom.playerOrder.length - 1, 1);

    if (everyoneGuessed) {
      transaction.update(roomRef(code), {
        status: "round_end",
        intermissionEndsAt: Date.now() + ROUND_BREAK_MS,
        turnEndsAt: null,
        updatedAt: serverTimestamp()
      });

      transaction.update(turnRef(code, turn.turnId), {
        status: "ended",
        updatedAt: serverTimestamp()
      });
    }
  });
}

export async function endRoundFromTimer(code: string, hostId: string) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      return;
    }

    const room = snapshot.data() as RoomDoc;

    if (
      room.hostId !== hostId ||
      room.status !== "drawing" ||
      !room.currentTurnId ||
      !room.turnEndsAt ||
      room.turnEndsAt > Date.now()
    ) {
      return;
    }

    transaction.update(roomRef(code), {
      status: "round_end",
      intermissionEndsAt: Date.now() + ROUND_BREAK_MS,
      turnEndsAt: null,
      updatedAt: serverTimestamp()
    });

    transaction.update(turnRef(code, room.currentTurnId), {
      status: "ended",
      updatedAt: serverTimestamp()
    });
  });
}

export async function skipDrawerTurn(code: string, hostId: string) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      return;
    }

    const room = snapshot.data() as RoomDoc;

    if (
      room.hostId !== hostId ||
      room.status !== "choosing" ||
      !room.choosingEndsAt ||
      room.choosingEndsAt > Date.now()
    ) {
      return;
    }

    if (room.currentTurnId) {
      transaction.update(turnRef(code, room.currentTurnId), {
        status: "ended",
        updatedAt: serverTimestamp()
      });
    }

    transaction.update(roomRef(code), {
      status: "round_end",
      choosingEndsAt: null,
      intermissionEndsAt: Date.now() + ROUND_BREAK_MS,
      updatedAt: serverTimestamp()
    });
  });
}

export async function endRoundEarly(code: string, hostId: string) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(code));

    if (!snapshot.exists()) {
      return;
    }

    const room = snapshot.data() as RoomDoc;

    if (room.hostId !== hostId || room.status !== "drawing" || !room.currentTurnId) {
      return;
    }

    transaction.update(roomRef(code), {
      status: "round_end",
      intermissionEndsAt: Date.now() + ROUND_BREAK_MS,
      turnEndsAt: null,
      updatedAt: serverTimestamp()
    });

    transaction.update(turnRef(code, room.currentTurnId), {
      status: "ended",
      updatedAt: serverTimestamp()
    });
  });
}

export async function advanceRound(code: string, hostId: string, room: RoomDoc, players: PlayerDoc[]) {
  if (room.hostId !== hostId) {
    throw new Error("Only the host can advance rounds.");
  }

  if (room.round >= room.totalRounds) {
    const leaderboard = [...players].sort((left, right) => right.score - left.score);
    const winner = leaderboard[0] ?? null;

    await updateDoc(roomRef(code), {
      status: "finished",
      currentDrawerId: null,
      currentTurnId: null,
      currentWordHash: null,
      maskedWord: "",
      revealedLetterIndexes: [],
      turnEndsAt: null,
      intermissionEndsAt: null,
      canvasRevision: 0,
      gameWinnerId: winner?.uid ?? null,
      gameWinnerName: winner?.displayName ?? null,
      updatedAt: serverTimestamp()
    });
    return;
  }

  const nextRound = room.round + 1;
  const order = room.playerOrder.length > 0 ? room.playerOrder : players.map((player) => player.uid);
  const drawerId = order[(nextRound - 1) % order.length];
  const turnId = makeTurnId();
  const batch = writeBatch(db);

  batch.update(roomRef(code), {
    status: "choosing",
    round: nextRound,
    currentDrawerId: drawerId,
    currentTurnId: turnId,
    currentWordHash: null,
    currentWordHashes: [],
    maskedWord: "",
    revealedLetterIndexes: [],
    choosingEndsAt: Date.now() + CHOOSING_SECONDS * 1000,
    turnEndsAt: null,
    intermissionEndsAt: null,
    canvasRevision: 0,
    firstCorrectId: null,
    updatedAt: serverTimestamp()
  });

  batch.set(turnRef(code, turnId), {
    ...defaultTurn(turnId, drawerId, nextRound),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  batch.set(
    privateRef(code, drawerId),
    {
      turnId,
      wordOptions: pickRandomWords(3, room.language ?? "en"),
      selectedWord: null,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await batch.commit();
}

export function getTimeLeft(turnEndsAt: number | null) {
  if (!turnEndsAt) {
    return ROUND_SECONDS;
  }

  return Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000));
}

export function getLeaderboard(players: PlayerDoc[]) {
  return [...players].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.displayName.localeCompare(right.displayName);
  });
}

export function shouldEvaluateMessage(room: RoomDoc | null, turn: TurnDoc | null, message: MessageDoc) {
  if (!room || !turn) return false;
  if (room.status !== "drawing" || turn.status !== "drawing") return false;
  if (message.type !== "guess" || message.evaluatedAt || !normalizeWord(message.text)) return false;
  if (message.playerId === turn.drawerId) return false;
  if (turn.guessedPlayerIds.includes(message.playerId)) return false;
  return true;
}

export function formatTimestamp(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp.toDate());
}

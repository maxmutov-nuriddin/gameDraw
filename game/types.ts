import type { Timestamp } from "firebase/firestore";
import type { Locale } from "@/utils/i18n";

export type RoomStatus = "lobby" | "choosing" | "drawing" | "round_end" | "finished";
export type DrawingTool = "brush" | "eraser";

export interface RoomDoc {
  code: string;
  language: Locale;
  hostId: string;
  status: RoomStatus;
  round: number;
  totalRounds: number;
  maxPlayers: number;
  minPlayers: number;
  playerCount: number;
  playerOrder: string[];
  currentDrawerId: string | null;
  currentTurnId: string | null;
  currentWordHash: string | null;
  currentWordHashes: string[];
  maskedWord: string;
  revealedLetterIndexes: number[];
  choosingEndsAt: number | null;
  turnEndsAt: number | null;
  intermissionEndsAt: number | null;
  canvasRevision: number;
  firstCorrectId: string | null;
  gameWinnerId: string | null;
  gameWinnerName: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PlayerDoc {
  uid: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  color: string;
  reaction: string | null;
  leftAt: number | null;
  joinedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PrivatePlayerDoc {
  turnId: string | null;
  wordOptions: string[];
  selectedWord: string | null;
  updatedAt?: Timestamp | null;
}

export interface TurnDoc {
  turnId: string;
  drawerId: string;
  round: number;
  status: "choosing" | "drawing" | "ended";
  guessedPlayerIds: string[];
  firstCorrectId: string | null;
  choosingEndsAt?: number | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MessageDoc {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  guessHash: string;
  isCorrect: boolean;
  rank: number | null;
  type: "guess" | "system";
  createdAt?: Timestamp | null;
  evaluatedAt?: Timestamp | null;
}

export interface StrokeDoc {
  id: string;
  drawerId: string;
  points: number[];
  color: string;
  size: number;
  tool: DrawingTool;
  revision: number;
  seq: number;
  createdAt?: Timestamp | null;
}

export interface RoomBundle {
  room: RoomDoc | null;
  players: PlayerDoc[];
  turn: TurnDoc | null;
  messages: MessageDoc[];
  strokes: StrokeDoc[];
  privateState: PrivatePlayerDoc | null;
  loading: boolean;
  error: string | null;
}

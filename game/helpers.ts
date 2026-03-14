import { PLAYER_COLORS } from "@/game/constants";
import { WORD_BANKS } from "@/game/words";
import type { Locale } from "@/utils/i18n";

export function pickRandomWords(count: number, locale: Locale = "en") {
  const pool = [...WORD_BANKS[locale]];
  const words: string[] = [];

  while (pool.length > 0 && words.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [word] = pool.splice(index, 1);
    words.push(word);
  }

  return words;
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function maskWord(word: string, revealedIndexes: number[] = []) {
  return word
    .split("")
    .map((character, index) => {
      if (character === " ") {
        return " ";
      }

      return revealedIndexes.includes(index) ? character.toUpperCase() : "_";
    })
    .join(" ");
}

export function nextHintIndexes(word: string, currentIndexes: number[]) {
  const candidates = word
    .split("")
    .map((character, index) => ({ character, index }))
    .filter(({ character, index }) => character !== " " && !currentIndexes.includes(index));

  if (candidates.length === 0) {
    return currentIndexes;
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return [...currentIndexes, choice.index].sort((left, right) => left - right);
}

export function getPlayerColor(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PLAYER_COLORS[total % PLAYER_COLORS.length];
}

export function getDisplayInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

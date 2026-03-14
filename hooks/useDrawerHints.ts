import { useEffect } from "react";

import { revealHint } from "@/firebase/roomService";
import { HINT_REVEAL_SCHEDULE } from "@/game/constants";
import { nextHintIndexes } from "@/game/helpers";
import type { PrivatePlayerDoc, RoomDoc } from "@/game/types";

interface DrawerHintOptions {
  code: string | null;
  uid: string | null;
  room: RoomDoc | null;
  privateState: PrivatePlayerDoc | null;
}

export function useDrawerHints({ code, uid, room, privateState }: DrawerHintOptions) {
  useEffect(() => {
    if (
      !code ||
      !uid ||
      !room ||
      room.currentDrawerId !== uid ||
      room.status !== "drawing" ||
      !room.turnEndsAt ||
      !privateState?.selectedWord
    ) {
      return;
    }

    const word = privateState.selectedWord;
    const timer = window.setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((room.turnEndsAt! - Date.now()) / 1000));
      const nextThreshold = HINT_REVEAL_SCHEDULE[room.revealedLetterIndexes.length];

      if (typeof nextThreshold !== "number" || secondsLeft > nextThreshold) {
        return;
      }

      const indexes = nextHintIndexes(word, room.revealedLetterIndexes);
      void revealHint(code, uid, word, indexes);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [code, privateState, room, uid]);
}

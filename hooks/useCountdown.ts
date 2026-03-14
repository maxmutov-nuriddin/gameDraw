import { useEffect, useState } from "react";

import { getTimeLeft } from "@/firebase/roomService";

export function useCountdown(target: number | null, fallback = 0) {
  const [secondsLeft, setSecondsLeft] = useState(target ? getTimeLeft(target) : fallback);

  useEffect(() => {
    setSecondsLeft(target ? getTimeLeft(target) : fallback);

    if (!target) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft(getTimeLeft(target));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [fallback, target]);

  return secondsLeft;
}

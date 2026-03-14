import { useEffect, useState } from "react";

const STORAGE_KEY = "draw-and-guess:name";

export function useDisplayName() {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (value) {
      setDisplayName(value);
    }
  }, []);

  const updateName = (value: string) => {
    setDisplayName(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  return { displayName, setDisplayName: updateName };
}

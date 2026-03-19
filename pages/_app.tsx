import type { AppProps } from "next/app";
import { useEffect } from "react";

import { I18nProvider } from "@/hooks/useI18n";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const prevent = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const el = event.target as HTMLElement;
      const scrollable = el.closest("[data-scroll]");
      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = scrollable as HTMLElement;
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight;
        const dy = event.touches[0].clientY;
        const startY = (scrollable as HTMLElement & { _startY?: number })._startY ?? dy;
        (scrollable as HTMLElement & { _startY?: number })._startY = startY;
        if ((atTop && dy > startY) || (atBottom && dy < startY)) {
          event.preventDefault();
        }
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  return (
    <I18nProvider>
      <div className="font-body">
        <Component {...pageProps} />
      </div>
    </I18nProvider>
  );
}

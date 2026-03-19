import type { AppProps } from "next/app";
import { useEffect } from "react";

import { I18nProvider } from "@/hooks/useI18n";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    let startY = 0;

    const onStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };

    const prevent = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const el = event.target as HTMLElement;
      const scrollable = el.closest("[data-scroll]");
      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = scrollable as HTMLElement;
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight;
        const dy = event.touches[0].clientY - startY;
        if ((atTop && dy > 0) || (atBottom && dy < 0)) {
          event.preventDefault();
        }
        return;
      }
      // Only prevent pull-to-refresh: downward swipe when page is at top
      if (window.scrollY <= 0 && event.touches[0].clientY > startY) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <I18nProvider>
      <div className="font-body">
        <Component {...pageProps} />
      </div>
    </I18nProvider>
  );
}

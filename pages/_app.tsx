import type { AppProps } from "next/app";

import { I18nProvider } from "@/hooks/useI18n";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <div className="font-body">
        <Component {...pageProps} />
      </div>
    </I18nProvider>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

import { CreateJoinCard } from "@/components/CreateJoinCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { createRoom, joinRoom } from "@/firebase/roomService";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useI18n } from "@/hooks/useI18n";
import { localizeErrorMessage } from "@/utils/i18n";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAnonymousAuth();
  const { displayName, setDisplayName } = useDisplayName();
  const { locale, t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireName = () => {
    if (!displayName.trim()) {
      throw new Error(t("errorNeedName"));
    }
  };

  const handleCreate = async () => {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      requireName();
      const code = await createRoom(user.uid, displayName, locale);
      await router.push(`/room/${code}`);
    } catch (createError) {
      setError(localizeErrorMessage(locale, createError instanceof Error ? createError.message : t("errorCreateRoom")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (code: string) => {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      requireName();
      const normalizedCode = await joinRoom(code, user.uid, displayName);
      await router.push(`/room/${normalizedCode}`);
    } catch (joinError) {
      setError(localizeErrorMessage(locale, joinError instanceof Error ? joinError.message : t("errorJoinRoom")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t("appName")}</title>
        <meta name="description" content={t("homeMetaDescription")} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Head>

      <div className="page-shell min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          {/* Header */}
          <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <div className="animate-slide-up">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal">
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                {t("homeTag")}
              </div>
              <h1 className="font-display text-4xl font-black text-navy sm:text-5xl">
                {t("appName")}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className={`rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-soft ${
                authLoading
                  ? "bg-white/60 text-slate-400"
                  : authError
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-700"
              }`}>
                {authLoading
                  ? "🔄 " + t("firebaseConnecting")
                  : authError
                    ? "⚠️ " + localizeErrorMessage(locale, authError)
                    : "🟢 " + t("firebaseReady")}
              </div>
            </div>
          </header>

          {/* Hero */}
          <div className="mb-12 animate-slide-up text-center">
            <p className="mx-auto max-w-2xl text-lg text-slate-500 sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {[
                { icon: "🎨", label: t("featureDraw") },
                { icon: "⚡", label: t("featureRealtime") },
                { icon: "🏆", label: t("featureLeaderboard") },
                { icon: "📱", label: t("featureMobile") },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-soft"
                >
                  <span>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <CreateJoinCard
            displayName={displayName}
            onNameChange={setDisplayName}
            onCreate={handleCreate}
            onJoin={handleJoin}
            loading={authLoading || submitting || !user}
            error={error}
          />

          <p className="mt-8 text-center text-xs text-slate-400">
            {t("noAccountNeeded")}
          </p>
        </div>
      </div>
    </>
  );
}

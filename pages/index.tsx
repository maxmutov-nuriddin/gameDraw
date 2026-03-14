import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

import { CreateJoinCard } from "@/components/CreateJoinCard";
import { HomeHero } from "@/components/HomeHero";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Panel } from "@/components/Panel";
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page-shell">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{t("homeTag")}</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-navy">{t("appName")}</h1>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <LanguageSwitcher />
              <Panel className="px-5 py-4">
                <p className="text-sm text-slate-600">
                  {authLoading
                    ? t("firebaseConnecting")
                    : localizeErrorMessage(locale, authError) ?? t("firebaseReady")}
                </p>
              </Panel>
            </div>
          </header>

          <HomeHero />

          <CreateJoinCard
            displayName={displayName}
            onNameChange={setDisplayName}
            onCreate={handleCreate}
            onJoin={handleJoin}
            loading={authLoading || submitting || !user}
            error={error}
          />
        </div>
      </div>
    </>
  );
}

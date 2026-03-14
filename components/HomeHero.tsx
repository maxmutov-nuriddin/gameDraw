import { Panel } from "@/components/Panel";
import { useI18n } from "@/hooks/useI18n";

export function HomeHero() {
  const { t } = useI18n();

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="animate-reveal space-y-6">
        <span className="inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-teal">
          {t("heroBadge")}
        </span>
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight text-navy sm:text-5xl md:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-700">
            {t("heroDescription")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel className="p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{t("statPlayers")}</p>
            <p className="mt-2 text-2xl font-bold text-navy">{t("statPlayersValue")}</p>
          </Panel>
          <Panel className="p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{t("statRounds")}</p>
            <p className="mt-2 text-2xl font-bold text-navy">{t("statRoundsValue")}</p>
          </Panel>
          <Panel className="p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{t("statRealtime")}</p>
            <p className="mt-2 text-2xl font-bold text-navy">{t("statRealtimeValue")}</p>
          </Panel>
        </div>
      </div>

      <Panel className="relative overflow-hidden p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,157,138,0.18),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(255,107,87,0.2),_transparent_30%)]" />
        <div className="relative space-y-4">
          <div className="rounded-[24px] bg-slate-950 p-4 shadow-soft">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-300">
              <span>{t("liveRound")}</span>
              <span>58s</span>
            </div>
            <div className="mt-4 h-56 rounded-[20px] bg-[linear-gradient(140deg,_#fff_0%,_#f7f1d5_100%)] p-4">
              <div className="grid h-full place-items-center rounded-[16px] border-2 border-dashed border-slate-300">
                <p className="text-center font-display text-2xl text-slate-500 sm:text-3xl">{t("canvasPreview")}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-[20px] bg-white p-4 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{t("guessBonus")}</p>
              <p className="mt-2 text-3xl font-bold text-coral">100 pts</p>
            </div>
            <div className="flex-1 rounded-[20px] bg-navy p-4 text-white shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">{t("drawerReward")}</p>
              <p className="mt-2 text-3xl font-bold">50 pts</p>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

import { FormEvent, useMemo, useState } from "react";

import { Panel } from "@/components/Panel";
import { formatTimestamp } from "@/firebase/roomService";
import { MAX_CHAT_LENGTH } from "@/game/constants";
import type { MessageDoc, TurnDoc } from "@/game/types";
import { useI18n } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

interface ChatPanelProps {
  messages: MessageDoc[];
  turn: TurnDoc | null;
  currentUserId: string;
  canGuess: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatPanel({ messages, turn, currentUserId, canGuess, onSend }: ChatPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const alreadySolved = useMemo(
    () => turn?.guessedPlayerIds.includes(currentUserId) ?? false,
    [currentUserId, turn?.guessedPlayerIds]
  );

  const disabled = !canGuess || alreadySolved;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setSending(true);

    try {
      await onSend(draft);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel className="flex h-full min-h-[360px] flex-col p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("roomChat")}</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-navy">{t("guessFeed")}</h2>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("messagesCount", { count: messages.length })}
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={classNames(
              "rounded-[20px] px-4 py-3",
              message.type === "system"
                ? "bg-slate-900 text-white"
                : message.isCorrect
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-white/80 text-slate-700"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{message.playerName}</p>
              <p className="text-xs opacity-70">{formatTimestamp(message.createdAt)}</p>
            </div>
            <p className="mt-1 break-words">
              {message.isCorrect ? `${message.text} • ${t("correctRank", { rank: message.rank ?? 0 })}` : message.text}
            </p>
          </div>
        ))}
      </div>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          maxLength={MAX_CHAT_LENGTH}
          disabled={disabled || sending}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            disabled
              ? alreadySolved
                ? t("alreadySolvedWord")
                : t("drawerChatDisabled")
              : t("typeYourGuess")
          }
          className="min-h-[96px] w-full rounded-[22px] border border-white/80 bg-white/80 px-4 py-3 outline-none transition focus:border-teal focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={disabled || sending || !draft.trim()}
          className="w-full rounded-2xl bg-coral px-5 py-3 font-semibold text-white transition hover:bg-[#ef593f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("sendGuess")}
        </button>
      </form>
    </Panel>
  );
}

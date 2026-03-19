import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const alreadySolved = useMemo(
    () => turn?.guessedPlayerIds.includes(currentUserId) ?? false,
    [currentUserId, turn?.guessedPlayerIds]
  );

  const disabled = !canGuess || alreadySolved;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !sending && draft.trim()) {
        void onSend(draft).then(() => setDraft(""));
      }
    }
  };

  return (
    <Panel className="flex flex-col p-4 sm:p-5" style={{ minHeight: "320px" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("roomChat")}</p>
          <h2 className="mt-0.5 font-display text-2xl font-black text-navy">{t("guessFeed")}</h2>
        </div>
        <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 shadow-soft">
          {t("messagesCount", { count: messages.length })}
        </span>
      </div>

      <div
        className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1"
        data-scroll
        style={{ minHeight: "180px", maxHeight: "340px" }}
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center py-8 text-center text-slate-400">
            <div>
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">{t("noGuessesYet")}</p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={classNames(
              "rounded-[16px] px-3.5 py-2.5 transition-all",
              message.type === "system"
                ? "bg-navy/90 text-white backdrop-blur-sm"
                : message.isCorrect
                  ? "guess-correct bg-gradient-to-r from-emerald-50 to-green-50 ring-1 ring-emerald-200"
                  : message.playerId === currentUserId
                    ? "bg-teal/8 ring-1 ring-teal/20"
                    : "bg-white/75"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={classNames(
                "text-xs font-bold",
                message.type === "system"
                  ? "text-white/80"
                  : message.isCorrect
                    ? "text-emerald-700"
                    : "text-slate-500"
              )}>
                {message.playerName}
              </p>
              <p className="text-[10px] opacity-50">{formatTimestamp(message.createdAt)}</p>
            </div>
            <p className={classNames(
              "mt-0.5 break-words text-sm font-semibold",
              message.type === "system"
                ? "text-white"
                : message.isCorrect
                  ? "text-emerald-800"
                  : "text-navy"
            )}>
              {message.isCorrect
                ? `✅ ${message.text} — ${t("correctRank", { rank: message.rank ?? 0 })}`
                : message.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          maxLength={MAX_CHAT_LENGTH}
          disabled={disabled || sending}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? alreadySolved
                ? t("alreadySolvedWord")
                : t("drawerChatDisabled")
              : t("typeYourGuess")
          }
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={disabled || sending || !draft.trim()}
          className="btn-coral shrink-0 px-4 py-2.5 text-sm"
        >
          {sending ? "..." : t("send")}
        </button>
      </form>
    </Panel>
  );
}

"use client";

import { Power } from "lucide-react";

type OnlineStatusControlProps = {
  isOnline: boolean;
  isLocked: boolean;
  isPending: boolean;
  onToggle: () => void;
  /** Compact switch for map header; prominent button for panels. */
  variant?: "compact" | "prominent";
};

export function OnlineStatusControl({
  isOnline,
  isLocked,
  isPending,
  onToggle,
  variant = "prominent"
}: OnlineStatusControlProps) {
  if (variant === "compact") {
    return (
      <button
        type="button"
        className={`rdr-online-toggle${isOnline ? " rdr-online-toggle--on" : ""}${isLocked ? " rdr-online-toggle--locked" : ""}`}
        onClick={onToggle}
        disabled={isPending || isLocked}
        aria-pressed={isOnline}
        aria-label={isLocked ? "Offline due to deficit" : isOnline ? "Go offline" : "Go online"}
      >
        <span className="rdr-online-toggle-track">
          <span className="rdr-online-toggle-thumb" />
        </span>
        <span className="rdr-online-toggle-label">
          {isLocked ? "Locked" : isOnline ? "Online" : "Offline"}
        </span>
      </button>
    );
  }

  const label = isLocked
    ? "Offline — deficit lock"
    : isPending
      ? "Updating…"
      : isOnline
        ? "Go offline"
        : "Go online";

  return (
    <button
      type="button"
      className={`rdr-online-btn${isOnline ? " rdr-online-btn--on" : ""}${isLocked ? " rdr-online-btn--locked" : ""}`}
      onClick={onToggle}
      disabled={isPending || isLocked}
      aria-pressed={isOnline}
    >
      <span className="rdr-online-btn-icon">
        <Power size={22} strokeWidth={2.5} />
      </span>
      <span className="rdr-online-btn-copy">
        <strong>{label}</strong>
        <span>
          {isLocked
            ? "Pay down your deficit on Earnings to unlock"
            : isOnline
              ? "You are receiving trip requests"
              : "Tap to start accepting trips"}
        </span>
      </span>
      {!isLocked ? (
        <span className={`rdr-online-btn-pill${isOnline ? " rdr-online-btn-pill--on" : ""}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      ) : null}
    </button>
  );
}

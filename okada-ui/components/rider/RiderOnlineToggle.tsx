"use client";

export function RiderOnlineToggle({
  displayIsOnline,
  isDeficitLocked,
  isPending,
  riderProfileId,
  onToggle
}: {
  displayIsOnline: boolean;
  isDeficitLocked: boolean;
  isPending: boolean;
  riderProfileId: string | undefined;
  onToggle: () => void;
}) {
  return (
    <button
      className={`exact-online-toggle ${displayIsOnline ? "is-online" : "is-offline"} ${
        isPending ? "is-pending" : ""
      }`}
      data-state={displayIsOnline ? "online" : "offline"}
      type="button"
      role="switch"
      aria-checked={displayIsOnline}
      aria-label={
        isDeficitLocked
          ? "Rider offline due to deficit lock"
          : displayIsOnline
            ? "Set rider offline"
            : "Set rider online"
      }
      title={
        isDeficitLocked
          ? "Rider offline due to deficit lock"
          : displayIsOnline
            ? "Set rider offline"
            : "Set rider online"
      }
      disabled={isPending || !riderProfileId || isDeficitLocked}
      onClick={onToggle}
    >
      <span>
        {isDeficitLocked
          ? "OFFLINE LOCKED"
          : isPending
            ? displayIsOnline
              ? "GOING ONLINE..."
              : "GOING OFFLINE..."
            : displayIsOnline
              ? "ONLINE"
              : "OFFLINE"}
      </span>
      <div className="exact-toggle-track" data-state={displayIsOnline ? "online" : "offline"}>
        <div className="exact-toggle-thumb" />
      </div>
    </button>
  );
}

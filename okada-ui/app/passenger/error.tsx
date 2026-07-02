"use client";

export default function PassengerError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pax-app flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">!</div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mb-6 max-w-xs text-sm text-gray-500">{error.message || "An unexpected error occurred."}</p>
      <button type="button" onClick={reset} className="pax-btn-primary max-w-xs">
        Try again
      </button>
    </div>
  );
}

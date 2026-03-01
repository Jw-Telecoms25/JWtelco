"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted text-sm mb-6 text-center max-w-md">
        An error occurred while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim"
      >
        Try Again
      </button>
    </div>
  );
}

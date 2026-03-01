"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted text-sm mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

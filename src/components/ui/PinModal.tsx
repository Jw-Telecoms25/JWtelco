"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { Modal } from "./Modal";

const PIN_LENGTH = 6;

interface PinModalProps {
  isOpen: boolean;
  onSuccess: (pinToken: string) => void;
  onCancel: () => void;
}

export function PinModal({ isOpen, onSuccess, onCancel }: PinModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(PIN_LENGTH).fill(null));

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(PIN_LENGTH).fill(""));
      setError(null);
      setAttemptsRemaining(null);
      setIsVerifying(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length >= 4) verifyPin(pin);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    const next = Array(PIN_LENGTH).fill("");
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus();
  }

  async function verifyPin(pin: string) {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.pinToken) {
        onSuccess(data.pinToken);
      } else if (res.status === 429) {
        setError("PIN locked. Try again in 30 minutes.");
      } else {
        setError(data.error || "Incorrect PIN");
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setDigits(Array(PIN_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  const pin = digits.join("");
  const canSubmit = pin.length >= 4 && !isVerifying;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Transaction PIN">
      <div className="flex flex-col items-center gap-5 pt-2">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-accent" />
        </div>

        <p className="text-sm text-muted text-center">
          Enter your transaction PIN to confirm this purchase.
        </p>

        <div className="flex gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 rounded-xl border border-border bg-surface text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0
                ? ` (${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left)`
                : ""}
            </span>
          </div>
        )}

        <button
          onClick={() => verifyPin(pin)}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
          {isVerifying ? "Verifying..." : "Confirm"}
        </button>

        <button
          onClick={onCancel}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

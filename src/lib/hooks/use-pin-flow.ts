"use client";

import { useState, useEffect, useRef } from "react";

interface PinModalProps {
  isOpen: boolean;
  onSuccess: (pinToken: string) => void;
  onCancel: () => void;
}

interface UsePinFlowResult {
  requiresPin: boolean;
  getPinToken: () => Promise<string | null>;
  clearCachedToken: () => void;
  pinModalProps: PinModalProps;
}

export function usePinFlow(): UsePinFlowResult {
  const [requiresPin, setRequiresPin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cachedToken, setCachedToken] = useState<{ raw: string; expires: number } | null>(null);
  const resolveRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    fetch("/api/wallet/pin")
      .then((r) => r.json())
      .then((d) => setRequiresPin(d.hasPin === true))
      .catch(() => {});
  }, []);

  function getValidCached(): string | null {
    if (!cachedToken) return null;
    const now = Math.floor(Date.now() / 1000);
    return cachedToken.expires - now > 10 ? cachedToken.raw : null;
  }

  async function getPinToken(): Promise<string | null> {
    if (!requiresPin) return null;
    const cached = getValidCached();
    if (cached) return cached;
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setShowModal(true);
    });
  }

  function handlePinSuccess(rawToken: string) {
    const expires = parseInt(rawToken.split(".").at(-1) ?? "0", 10);
    setCachedToken({ raw: rawToken, expires });
    setShowModal(false);
    resolveRef.current?.(rawToken);
    resolveRef.current = null;
  }

  function handlePinCancel() {
    setShowModal(false);
    resolveRef.current?.(null);
    resolveRef.current = null;
  }

  return {
    requiresPin,
    getPinToken,
    clearCachedToken: () => setCachedToken(null),
    pinModalProps: {
      isOpen: showModal,
      onSuccess: handlePinSuccess,
      onCancel: handlePinCancel,
    },
  };
}

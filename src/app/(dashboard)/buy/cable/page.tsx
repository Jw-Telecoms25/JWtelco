"use client";

import { useState } from "react";
import { Tv } from "lucide-react";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { CABLE_PROVIDERS } from "@/lib/utils/constants";
import { formatNaira } from "@/lib/utils/format";
import { isValidSmartcardNumber } from "@/lib/utils/validators";
import { usePricing } from "@/lib/hooks/use-services";

export default function BuyCablePage() {
  const [provider, setProvider] = useState("");
  const [smartcard, setSmartcard] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { plans, isLoading: plansLoading } = usePricing("cable", provider);

  const selectedPlan = plans.find((p) => p.plan_code === planCode);

  async function verifySmartcard() {
    if (!smartcard || !isValidSmartcardNumber(smartcard)) {
      setErrors((e) => ({ ...e, smartcard: "Enter a valid smartcard number" }));
      return;
    }
    if (!provider) {
      setErrors((e) => ({ ...e, provider: "Select a provider" }));
      return;
    }

    setIsVerifying(true);
    setCustomerName("");
    try {
      const res = await fetch("/api/services/cable/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smartcardNumber: smartcard, provider }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomerName(data.customer_name);
        setErrors((e) => {
          const { smartcard: _, ...rest } = e;
          return rest;
        });
      } else {
        setErrors((e) => ({ ...e, smartcard: "Smartcard verification failed" }));
      }
    } catch {
      setErrors((e) => ({ ...e, smartcard: "Verification error" }));
    } finally {
      setIsVerifying(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!provider) errs.provider = "Select a provider";
    if (!smartcard || !isValidSmartcardNumber(smartcard)) errs.smartcard = "Invalid smartcard";
    if (!customerName) errs.smartcard = "Please verify smartcard first";
    if (!planCode) errs.plan = "Select a plan";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) throw new Error("Please fix the form errors");

    const res = await fetch("/api/services/cable/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smartcardNumber: smartcard, provider, planCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  return (
    <ServiceForm
      title="Cable TV Subscription"
      onSubmit={handleSubmit}
      submitLabel={
        selectedPlan
          ? `Subscribe ${selectedPlan.plan_name} — ${formatNaira(selectedPlan.user_price)}`
          : "Subscribe"
      }
    >
      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Provider
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CABLE_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProvider(p.id);
                setPlanCode("");
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                provider === p.id
                  ? "border-current bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
                  : "border-border hover:border-muted"
              }`}
              style={provider === p.id ? { color: p.color } : undefined}
            >
              <ProviderLogo id={p.id} name={p.name} color={p.color} />
              {p.name}
            </button>
          ))}
        </div>
        {errors.provider && (
          <p className="text-red-500 text-xs mt-1">{errors.provider}</p>
        )}
      </div>

      {/* Smartcard Number */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Smartcard / IUC Number
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tv className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={smartcard}
              onChange={(e) => {
                setSmartcard(e.target.value);
                setCustomerName("");
              }}
              placeholder="Enter smartcard number"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="Smartcard number"
            />
          </div>
          <button
            type="button"
            onClick={verifySmartcard}
            disabled={isVerifying}
            className="px-4 py-2.5 rounded-xl border border-accent text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {isVerifying ? "..." : "Verify"}
          </button>
        </div>
        {customerName && (
          <p className="text-emerald text-sm mt-1">Customer: {customerName}</p>
        )}
        {errors.smartcard && (
          <p className="text-red-500 text-xs mt-1">{errors.smartcard}</p>
        )}
      </div>

      {/* Plans */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Package
        </label>
        {!provider ? (
          <p className="text-muted text-sm">Select a provider first</p>
        ) : plansLoading ? (
          <p className="text-muted text-sm">Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-muted text-sm">No plans available</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {plans.map((plan) => (
              <button
                key={plan.plan_code}
                type="button"
                onClick={() => setPlanCode(plan.plan_code)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  planCode === plan.plan_code
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-muted"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{plan.plan_name}</p>
                  {plan.validity && (
                    <p className="text-xs text-muted">{plan.validity}</p>
                  )}
                </div>
                <p className="font-semibold text-sm">
                  {formatNaira(plan.user_price)}
                </p>
              </button>
            ))}
          </div>
        )}
        {errors.plan && (
          <p className="text-red-500 text-xs mt-1">{errors.plan}</p>
        )}
      </div>
    </ServiceForm>
  );
}

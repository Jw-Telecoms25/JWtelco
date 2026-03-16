"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { NETWORKS } from "@/lib/utils/constants";
import { formatNaira } from "@/lib/utils/format";
import { isValidPhone } from "@/lib/utils/validators";
import { usePricing } from "@/lib/hooks/use-services";

export default function BuyDataPage() {
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { plans, isLoading: plansLoading } = usePricing("data", network);

  const selectedPlan = plans.find((p) => p.plan_code === planCode);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!network) errs.network = "Select a network";
    if (!phone || !isValidPhone(phone)) errs.phone = "Enter a valid Nigerian phone number";
    if (!planCode) errs.plan = "Select a data plan";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(pinToken: string | null) {
    if (!validate()) throw new Error("Please fix the form errors");

    const res = await fetch("/api/services/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pinToken ? { "x-pin-token": pinToken } : {}),
      },
      body: JSON.stringify({ phone, network, planCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  return (
    <ServiceForm
      title="Buy Data"
      onSubmit={handleSubmit}
      submitLabel={
        selectedPlan
          ? `Buy ${selectedPlan.plan_name} — ${formatNaira(selectedPlan.user_price)}`
          : "Buy Data"
      }
    >
      {/* Network Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Network
        </label>
        <div className="grid grid-cols-4 gap-2">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNetwork(n.id);
                setPlanCode("");
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                network === n.id
                  ? "border-current bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
                  : "border-border hover:border-muted"
              }`}
              style={network === n.id ? { color: n.color } : undefined}
            >
              <ProviderLogo id={n.id} name={n.name} color={n.color} />
              {n.name}
            </button>
          ))}
        </div>
        {errors.network && (
          <p className="text-red-500 text-xs mt-1">{errors.network}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            aria-label="Phone number"
          />
        </div>
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Data Plans */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data Plan
        </label>
        {!network ? (
          <p className="text-muted text-sm">Select a network first</p>
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

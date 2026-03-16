"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { NETWORKS } from "@/lib/utils/constants";
import { formatNaira, nairaToKobo } from "@/lib/utils/format";
import { isValidPhone } from "@/lib/utils/validators";

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function BuyAirtimePage() {
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!network) errs.network = "Select a network";
    if (!phone || !isValidPhone(phone)) errs.phone = "Enter a valid Nigerian phone number";
    const finalAmount = amount || Number(customAmount);
    if (!finalAmount || finalAmount < 50 || finalAmount > 50000) {
      errs.amount = "Amount must be between ₦50 and ₦50,000";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(pinToken: string | null) {
    if (!validate()) throw new Error("Please fix the form errors");

    const finalAmount = amount || Number(customAmount);
    const res = await fetch("/api/services/airtime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pinToken ? { "x-pin-token": pinToken } : {}),
      },
      body: JSON.stringify({
        phone,
        network,
        amount: nairaToKobo(finalAmount),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  const finalAmount = amount || Number(customAmount) || 0;

  return (
    <ServiceForm
      title="Buy Airtime"
      onSubmit={handleSubmit}
      submitLabel={finalAmount ? `Buy ${formatNaira(nairaToKobo(finalAmount))} Airtime` : "Buy Airtime"}
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
              onClick={() => setNetwork(n.id)}
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

      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Amount
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAmount(a);
                setCustomAmount("");
              }}
              className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                amount === a
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:border-muted"
              }`}
            >
              {formatNaira(nairaToKobo(a))}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(0);
            }}
            placeholder="Or enter custom amount"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            min={50}
            max={50000}
            aria-label="Custom amount"
          />
        </div>
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>
    </ServiceForm>
  );
}

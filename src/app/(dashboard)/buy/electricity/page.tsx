"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { DISCOS } from "@/lib/utils/constants";
import { formatNaira, nairaToKobo } from "@/lib/utils/format";
import { isValidMeterNumber } from "@/lib/utils/validators";

export default function BuyElectricityPage() {
  const [disco, setDisco] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function verifyMeter() {
    if (!meterNumber || !isValidMeterNumber(meterNumber)) {
      setErrors((e) => ({ ...e, meter: "Enter a valid meter number (11-13 digits)" }));
      return;
    }
    if (!disco) {
      setErrors((e) => ({ ...e, disco: "Select a distribution company" }));
      return;
    }

    setIsVerifying(true);
    setCustomerName("");
    try {
      const res = await fetch("/api/services/electricity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meterNumber, disco, meterType }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomerName(data.customer_name);
        setErrors((e) => {
          const { meter, ...rest } = e;
          return rest;
        });
      } else {
        setErrors((e) => ({ ...e, meter: "Meter verification failed" }));
      }
    } catch {
      setErrors((e) => ({ ...e, meter: "Verification error" }));
    } finally {
      setIsVerifying(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!disco) errs.disco = "Select a distribution company";
    if (!meterNumber || !isValidMeterNumber(meterNumber)) errs.meter = "Invalid meter number";
    if (!customerName) errs.meter = "Please verify meter first";
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100 || numAmount > 50000) {
      errs.amount = "Amount must be between ₦100 and ₦50,000";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(pinToken: string | null) {
    if (!validate()) throw new Error("Please fix the form errors");

    const res = await fetch("/api/services/electricity/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pinToken ? { "x-pin-token": pinToken } : {}),
      },
      body: JSON.stringify({
        meterNumber,
        disco,
        meterType,
        amount: nairaToKobo(Number(amount)),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  return (
    <ServiceForm
      title="Buy Electricity"
      onSubmit={handleSubmit}
      submitLabel={
        Number(amount) > 0
          ? `Pay ${formatNaira(nairaToKobo(Number(amount)))}`
          : "Buy Electricity"
      }
    >
      {/* DisCo Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Distribution Company
        </label>
        <select
          value={disco}
          onChange={(e) => setDisco(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          aria-label="Distribution company"
        >
          <option value="">Select DisCo</option>
          {DISCOS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.disco && (
          <p className="text-red-500 text-xs mt-1">{errors.disco}</p>
        )}
      </div>

      {/* Meter Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Meter Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["prepaid", "postpaid"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMeterType(type)}
              className={`p-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                meterType === type
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:border-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Meter Number */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Meter Number
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={meterNumber}
              onChange={(e) => {
                setMeterNumber(e.target.value);
                setCustomerName("");
              }}
              placeholder="Enter meter number"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="Meter number"
            />
          </div>
          <button
            type="button"
            onClick={verifyMeter}
            disabled={isVerifying}
            className="px-4 py-2.5 rounded-xl border border-accent text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {isVerifying ? "..." : "Verify"}
          </button>
        </div>
        {customerName && (
          <p className="text-emerald text-sm mt-1">Customer: {customerName}</p>
        )}
        {errors.meter && (
          <p className="text-red-500 text-xs mt-1">{errors.meter}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Amount (₦)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount (₦100 - ₦50,000)"
          min={100}
          max={50000}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          aria-label="Amount"
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>
    </ServiceForm>
  );
}

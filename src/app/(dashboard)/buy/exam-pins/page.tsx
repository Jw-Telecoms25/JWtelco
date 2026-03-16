"use client";

import { useState } from "react";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { EXAM_TYPES } from "@/lib/utils/constants";
import { formatNaira } from "@/lib/utils/format";
import { usePricing } from "@/lib/hooks/use-services";

export default function BuyExamPinsPage() {
  const [examType, setExamType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { plans, isLoading: plansLoading } = usePricing("exam-pins", examType);

  const plan = plans[0]; // First matching plan

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!examType) errs.exam = "Select an exam type";
    if (quantity < 1 || quantity > 5) errs.quantity = "Quantity must be 1-5";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(pinToken: string | null) {
    if (!validate()) throw new Error("Please fix the form errors");

    const res = await fetch("/api/services/exam-pins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pinToken ? { "x-pin-token": pinToken } : {}),
      },
      body: JSON.stringify({ examType, quantity }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  const totalPrice = plan ? plan.user_price * quantity : 0;

  return (
    <ServiceForm
      title="Buy Exam Pins"
      onSubmit={handleSubmit}
      submitLabel={
        totalPrice > 0
          ? `Buy ${quantity} Pin${quantity > 1 ? "s" : ""} — ${formatNaira(totalPrice)}`
          : "Buy Exam Pin"
      }
    >
      {/* Exam Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Exam Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EXAM_TYPES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setExamType(e.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                examType === e.id
                  ? "border-current bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
                  : "border-border hover:border-muted"
              }`}
              style={examType === e.id ? { color: e.color } : undefined}
            >
              <ProviderLogo id={e.id} name={e.name} color={e.color} />
              {e.name}
            </button>
          ))}
        </div>
        {errors.exam && (
          <p className="text-red-500 text-xs mt-1">{errors.exam}</p>
        )}
      </div>

      {/* Plan info */}
      {examType && !plansLoading && plan && (
        <div className="p-3 bg-surface-elevated rounded-xl border border-border">
          <p className="font-medium text-sm">{plan.plan_name}</p>
          <p className="text-accent font-semibold">{formatNaira(plan.user_price)} each</p>
        </div>
      )}
      {examType && plansLoading && (
        <p className="text-muted text-sm">Loading...</p>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Quantity
        </label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          aria-label="Quantity"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {errors.quantity && (
          <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
        )}
      </div>
    </ServiceForm>
  );
}

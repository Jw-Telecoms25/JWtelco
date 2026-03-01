"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { formatNaira } from "@/lib/utils/format";
import { useUIStore } from "@/lib/stores/ui-store";
import type { PricingPlan, Service } from "@/lib/services/types";

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<(PricingPlan & { services?: { name: string; slug: string } })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState<PricingPlan | null>(null);
  const [editValues, setEditValues] = useState({
    user_price: "",
    agent_price: "",
    vendor_price: "",
    cost_price: "",
    enabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/admin/pricing${serviceFilter ? `?serviceId=${serviceFilter}` : ""}`),
        fetch("/api/admin/services"),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      setPricing(pData.pricing || []);
      setServices(sData.services || []);
    } catch {
      addToast({ type: "error", title: "Failed to load pricing" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFilter]);

  function openEdit(plan: PricingPlan) {
    setEditModal(plan);
    setEditValues({
      user_price: String(plan.user_price / 100),
      agent_price: String(plan.agent_price / 100),
      vendor_price: String(plan.vendor_price / 100),
      cost_price: String(plan.cost_price / 100),
      enabled: plan.enabled,
    });
  }

  async function handleSave() {
    if (!editModal) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModal.id,
          user_price: Math.round(Number(editValues.user_price) * 100),
          agent_price: Math.round(Number(editValues.agent_price) * 100),
          vendor_price: Math.round(Number(editValues.vendor_price) * 100),
          cost_price: Math.round(Number(editValues.cost_price) * 100),
          enabled: editValues.enabled,
        }),
      });
      if (!res.ok) throw new Error();
      addToast({ type: "success", title: "Pricing updated" });
      setEditModal(null);
      fetchData();
    } catch {
      addToast({ type: "error", title: "Failed to update pricing" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pricing</h1>
      </div>

      {/* Filter */}
      <select
        value={serviceFilter}
        onChange={(e) => setServiceFilter(e.target.value)}
        className="px-3 py-2 rounded-xl border border-border bg-surface text-sm"
        aria-label="Filter by service"
      >
        <option value="">All Services</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Network</th>
                <th className="text-right py-3 px-4 font-medium text-muted">User Price</th>
                <th className="text-right py-3 px-4 font-medium text-muted">Agent Price</th>
                <th className="text-right py-3 px-4 font-medium text-muted">Vendor Price</th>
                <th className="text-right py-3 px-4 font-medium text-muted">Cost Price</th>
                <th className="text-center py-3 px-4 font-medium text-muted">Enabled</th>
                <th className="text-center py-3 px-4 font-medium text-muted">Edit</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-surface-elevated">
                  <td className="py-3 px-4 font-medium">{p.plan_name}</td>
                  <td className="py-3 px-4 text-muted capitalize">{p.network || "-"}</td>
                  <td className="py-3 px-4 text-right">{formatNaira(p.user_price)}</td>
                  <td className="py-3 px-4 text-right">{formatNaira(p.agent_price)}</td>
                  <td className="py-3 px-4 text-right">{formatNaira(p.vendor_price)}</td>
                  <td className="py-3 px-4 text-right">{formatNaira(p.cost_price)}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`w-2 h-2 inline-block rounded-full ${
                        p.enabled ? "bg-emerald" : "bg-red-400"
                      }`}
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              Edit: {editModal.plan_name}
            </h2>

            <div className="space-y-3">
              {(["user_price", "agent_price", "vendor_price", "cost_price"] as const).map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize">
                      {field.replace("_", " ")} (₦)
                    </label>
                    <input
                      type="number"
                      value={editValues[field]}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, [field]: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                      aria-label={field}
                    />
                  </div>
                )
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editValues.enabled}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, enabled: e.target.checked }))
                  }
                  className="rounded"
                />
                Enabled
              </label>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

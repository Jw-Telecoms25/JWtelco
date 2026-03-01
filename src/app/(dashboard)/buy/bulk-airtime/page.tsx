"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Send } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { formatNaira, nairaToKobo } from "@/lib/utils/format";

interface BulkRow {
  phone: string;
  network: string;
  amount: string;
}

interface ResultItem {
  index: number;
  phone: string;
  status: string;
  reference: string;
  error?: string;
}

const NETWORKS = ["mtn", "airtel", "glo", "9mobile"];
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const emptyRow = (): BulkRow => ({ phone: "", network: "mtn", amount: "" });

export default function BulkAirtimePage() {
  const addToast = useUIStore((s) => s.addToast);
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  function updateRow(idx: number, field: keyof BulkRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    if (rows.length >= 20) return;
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function applyQuickAmount(naira: number) {
    setQuickAmount(naira);
    setRows((prev) => prev.map((r) => ({ ...r, amount: String(naira) })));
  }

  function getTotal() {
    return rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  const validRows = rows.filter((r) => r.phone && r.network && Number(r.amount) >= 50);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults(null);

    if (validRows.length === 0) {
      addToast({ type: "error", title: "Add at least one valid entry" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services/bulk-airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => ({
            phone: r.phone,
            network: r.network,
            amount: nairaToKobo(Number(r.amount)),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", title: data.error || "Bulk purchase failed" });
        return;
      }

      setResults(data.results);
      addToast({
        type: data.successful === data.total ? "success" : "warning",
        title: `${data.successful}/${data.total} successful`,
      });
    } catch {
      addToast({ type: "error", title: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Airtime</h1>
        <p className="text-sm text-muted mt-1">Send airtime to multiple numbers at once (max 20)</p>
      </div>

      {/* Quick amount selector */}
      <div>
        <p className="text-sm font-medium mb-2">Quick fill — same amount for all:</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => applyQuickAmount(a)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                quickAmount === a ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-muted"
              }`}
            >
              {formatNaira(nairaToKobo(a))}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="text-xs text-muted w-5 flex-shrink-0 text-right">{idx + 1}</span>

            <input
              type="tel"
              value={row.phone}
              onChange={(e) => updateRow(idx, "phone", e.target.value)}
              placeholder="08012345678"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />

            <select
              value={row.network}
              onChange={(e) => updateRow(idx, "network", e.target.value)}
              className="w-24 px-2 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {NETWORKS.map((n) => (
                <option key={n} value={n}>{n.toUpperCase()}</option>
              ))}
            </select>

            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">₦</span>
              <input
                type="number"
                value={row.amount}
                onChange={(e) => { updateRow(idx, "amount", e.target.value); setQuickAmount(null); }}
                placeholder="500"
                min={50}
                max={50000}
                className="w-full pl-7 pr-2 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={rows.length <= 1}
              className="p-2 text-muted hover:text-red-500 transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Trash2 size={16} />
            </button>

            {results && results[idx] && (
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                results[idx].status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
                {results[idx].status}
              </span>
            )}
          </div>
        ))}

        {rows.length < 20 && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-dim transition-colors"
          >
            <Plus size={16} />
            Add another
          </button>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border mt-4">
          <div>
            <p className="text-sm text-muted">
              {validRows.length} recipient{validRows.length !== 1 ? "s" : ""}
            </p>
            <p className="text-lg font-bold">{formatNaira(nairaToKobo(getTotal()))}</p>
          </div>
          <button
            type="submit"
            disabled={loading || validRows.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-navy font-semibold rounded-xl hover:bg-accent-bright transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            {loading ? "Sending..." : "Send All"}
          </button>
        </div>
      </form>
    </div>
  );
}

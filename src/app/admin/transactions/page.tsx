"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Receipt } from "lucide-react";
import { formatNaira, formatDate } from "@/lib/utils/format";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/lib/utils/constants";
import { typeIcons, typeColors } from "@/lib/utils/transaction-display";
import type { TransactionType } from "@/lib/services/types";
import { useUIStore } from "@/lib/stores/ui-store";

interface AdminTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  profit: number;
  status: string;
  reference: string;
  description: string;
  created_at: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch {
      addToast({ type: "error", title: "Failed to load transactions" });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter, search, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <span className="text-sm text-muted">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by reference..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
            aria-label="Search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-xl border border-border bg-surface text-sm"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {Object.values(TRANSACTION_STATUS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-xl border border-border bg-surface text-sm"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          {Object.values(TRANSACTION_TYPES).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-muted mx-auto mb-2" />
          <p className="text-muted">No transactions found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">Profit</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface-elevated">
                    <td className="py-3 px-4">
                      {t.profiles
                        ? `${t.profiles.first_name} ${t.profiles.last_name}`
                        : "Unknown"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[t.type as TransactionType] ?? "bg-gray-50 text-gray-600"}`}>
                        {typeIcons[t.type as TransactionType]}
                        {t.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-48 truncate">{t.description}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatNaira(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald font-medium">
                      {t.profit > 0 ? formatNaira(t.profit) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          t.status === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-muted">{t.reference}</code>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

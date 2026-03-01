"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, MoreVertical, UserCheck, UserX, CreditCard, MinusCircle } from "lucide-react";
import { formatNaira, nairaToKobo, formatDate } from "@/lib/utils/format";
import { useUIStore } from "@/lib/stores/ui-store";
import type { Profile } from "@/lib/services/types";

interface CustomerWithWallet extends Profile {
  wallets: { balance: number; type: string }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithWallet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    userId: string;
    action: "credit" | "debit" | "block" | "activate";
    name: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isActing, setIsActing] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch {
      addToast({ type: "error", title: "Failed to load customers" });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleAction() {
    if (!actionModal) return;
    setIsActing(true);
    try {
      const body: Record<string, unknown> = {
        userId: actionModal.userId,
        action: actionModal.action,
        reason,
      };
      if (actionModal.action === "credit" || actionModal.action === "debit") {
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 1) {
          addToast({ type: "error", title: "Enter a valid amount" });
          setIsActing(false);
          return;
        }
        body.amount = nairaToKobo(numAmount);
      }

      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      addToast({ type: "success", title: `Action completed: ${actionModal.action}` });
      setActionModal(null);
      setAmount("");
      setReason("");
      fetchCustomers();
    } catch (err) {
      addToast({
        type: "error",
        title: "Action failed",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsActing(false);
    }
  }

  function getBalance(customer: CustomerWithWallet): number {
    const main = customer.wallets?.find((w) => w.type === "main");
    return main?.balance ?? 0;
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <span className="text-sm text-muted">{total} total</span>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
          aria-label="Search customers"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Joined</th>
                  <th className="text-center py-3 px-4 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-elevated">
                    <td className="py-3 px-4 font-medium">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="py-3 px-4 text-muted">{c.email}</td>
                    <td className="py-3 px-4 text-muted">{c.phone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-surface-elevated capitalize">
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          c.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "blocked"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatNaira(getBalance(c))}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {c.status === "active" ? (
                          <button
                            onClick={() =>
                              setActionModal({ userId: c.id, action: "block", name: `${c.first_name} ${c.last_name}` })
                            }
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                            title="Block user"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setActionModal({ userId: c.id, action: "activate", name: `${c.first_name} ${c.last_name}` })
                            }
                            className="p-1.5 rounded-lg text-emerald hover:bg-emerald-50"
                            title="Activate user"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setActionModal({ userId: c.id, action: "credit", name: `${c.first_name} ${c.last_name}` })
                          }
                          className="p-1.5 rounded-lg text-accent hover:bg-accent/10"
                          title="Credit wallet"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setActionModal({ userId: c.id, action: "debit", name: `${c.first_name} ${c.last_name}` })
                          }
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                          title="Debit wallet"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-2 capitalize">
              {actionModal.action} — {actionModal.name}
            </h2>

            {(actionModal.action === "credit" || actionModal.action === "debit") && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in Naira"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
                  min={1}
                  aria-label="Amount"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for this action"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
                aria-label="Reason"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal(null);
                  setAmount("");
                  setReason("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50"
              >
                {isActing && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

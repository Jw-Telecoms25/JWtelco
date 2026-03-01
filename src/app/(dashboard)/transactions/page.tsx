"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt, ArrowDownRight, ArrowUpRight, Loader2, Search, ExternalLink } from "lucide-react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { formatNaira, formatDate } from "@/lib/utils/format";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/lib/utils/constants";

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const { transactions, isLoading, total, reload } = useTransactions(ITEMS_PER_PAGE);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    reload(newPage);
  }

  const filtered = filter
    ? transactions.filter(
        (t) =>
          t.type === filter ||
          t.status === filter ||
          t.reference.toLowerCase().includes(filter.toLowerCase()) ||
          t.description.toLowerCase().includes(filter.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted">{total} total</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by reference or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
            aria-label="Search transactions"
          />
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-muted mx-auto mb-2" />
          <p className="text-muted">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase">Type</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase">Description</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase">Reference</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase text-right">Amount</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase">Date</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => {
                  const isCredit = txn.type === "funding" || txn.type === "reversal";
                  return (
                    <tr key={txn.id} className="border-b border-border/50 hover:bg-surface-elevated">
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated font-medium capitalize">
                          {txn.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{txn.description}</td>
                      <td className="py-3 px-4">
                        <code className="text-xs text-muted">{txn.reference}</code>
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold text-right ${isCredit ? "text-emerald" : "text-red-500"}`}>
                        {isCredit ? "+" : "-"}{formatNaira(txn.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            txn.status === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : txn.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : txn.status === "reversed"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">{formatDate(txn.created_at)}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/receipt/${txn.reference}`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          Receipt <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-2">
            {filtered.map((txn) => {
              const isCredit = txn.type === "funding" || txn.type === "reversal";
              return (
                <Link key={txn.id} href={`/receipt/${txn.reference}`} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{txn.description || txn.type}</p>
                      <p className="text-xs text-muted">{formatDate(txn.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isCredit ? "text-emerald" : "text-red-500"}`}>
                      {isCredit ? "+" : "-"}{formatNaira(txn.amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        txn.status === "success" ? "bg-emerald-100 text-emerald-700" : txn.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-surface-elevated"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-surface-elevated"
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

"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { formatNaira, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { typeIcons, typeColors, statusBadge, creditTypes } from "@/lib/utils/transaction-display";
import type { TransactionType, TransactionStatus } from "@/lib/services/types";

export function RecentTransactions() {
  const { transactions, isLoading } = useTransactions(5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="text-xs font-medium text-accent hover:text-accent-bright transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="bg-surface rounded-xl border border-border divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Wallet size={32} className="text-muted" />
            <p className="text-sm text-muted">No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isCredit = creditTypes.includes(tx.type);

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 p-2 rounded-xl ${typeColors[tx.type]}`}
                >
                  {typeIcons[tx.type]}
                </div>

                {/* Description + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(tx.created_at)}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-sm font-semibold ${
                      isCredit ? "text-emerald" : "text-red-500"
                    }`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatNaira(tx.amount)}
                  </span>
                  <Badge variant={statusBadge[tx.status]}>{tx.status}</Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

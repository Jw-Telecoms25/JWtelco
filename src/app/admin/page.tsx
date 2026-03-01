"use client";

import { useEffect, useState } from "react";
import { Users, Wallet, Receipt, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { formatNaira } from "@/lib/utils/format";

interface Stats {
  totalUsers: number;
  totalWalletBalance: number;
  totalTransactions: number;
  totalSalesVolume: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers?.toLocaleString() ?? "0",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Wallet Balance",
      value: formatNaira(stats?.totalWalletBalance ?? 0),
      icon: Wallet,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Transactions",
      value: stats?.totalTransactions?.toLocaleString() ?? "0",
      icon: Receipt,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Sales Volume",
      value: formatNaira(stats?.totalSalesVolume ?? 0),
      icon: TrendingUp,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Revenue (Profit)",
      value: formatNaira(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
              >
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-muted">{card.label}</p>
            <p className="text-xl font-bold mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

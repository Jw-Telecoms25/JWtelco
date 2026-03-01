"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, Loader2, Copy, Building2, CreditCard } from "lucide-react";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { formatNaira, nairaToKobo } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/format";
import { useUIStore } from "@/lib/stores/ui-store";

export default function WalletPage() {
  const { balance, isLoading: walletLoading, refreshBalance } = useWallet();
  const { transactions, isLoading: txnLoading } = useTransactions(10);
  const addToast = useUIStore((s) => s.addToast);
  const searchParams = useSearchParams();
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundTab, setFundTab] = useState<"card" | "transfer">("card");
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [bankAccount, setBankAccount] = useState<{
    accountNumber: string;
    bankName: string;
    accountName: string;
  } | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) return;

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/wallet/fund/verify?reference=${reference}`);
        const data = await res.json();

        if (data.status === "success") {
          addToast({ type: "success", title: "Wallet funded successfully" });
          refreshBalance();
        } else if (data.status === "abandoned") {
          addToast({ type: "error", title: "Payment cancelled" });
        } else {
          addToast({ type: "info", title: "Payment pending", message: "We're confirming your payment" });
        }
      } catch {
        addToast({ type: "error", title: "Could not verify payment" });
      }

      window.history.replaceState({}, "", "/wallet");
    }

    verifyPayment();
  }, [searchParams]);

  async function fetchBankAccount() {
    if (bankAccount) return;
    setBankLoading(true);
    try {
      const res = await fetch("/api/wallet/account");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBankAccount(data);
    } catch (err) {
      addToast({
        type: "error",
        title: "Could not load bank account",
        message: err instanceof Error ? err.message : "Try again later",
      });
    } finally {
      setBankLoading(false);
    }
  }

  function copyAccountNumber() {
    if (!bankAccount) return;
    navigator.clipboard.writeText(bankAccount.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

  async function handleFund() {
    const amount = Number(fundAmount);
    if (!amount || amount < 100 || amount > 1000000) {
      addToast({ type: "error", title: "Invalid amount", message: "Enter between ₦100 and ₦1,000,000" });
      return;
    }

    setIsFunding(true);
    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: nairaToKobo(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.authorization_url;
    } catch (err) {
      addToast({
        type: "error",
        title: "Funding failed",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
      setIsFunding(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-navy to-accent-dim rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 opacity-80" />
          <span className="text-sm opacity-80">Available Balance</span>
        </div>
        <p className="text-3xl font-bold">
          {walletLoading ? "..." : formatNaira(balance)}
        </p>
        <button
          onClick={() => setShowFundModal(true)}
          className="mt-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Fund Wallet
        </button>
      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Fund Wallet</h2>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setFundTab("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  fundTab === "card"
                    ? "bg-surface shadow-sm text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  setFundTab("transfer");
                  fetchBankAccount();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  fundTab === "transfer"
                    ? "bg-surface shadow-sm text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Bank Transfer
              </button>
            </div>

            {fundTab === "card" ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setFundAmount(String(a))}
                      className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                        fundAmount === String(a)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      {formatNaira(nairaToKobo(a))}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Or enter custom amount"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-4"
                  min={100}
                  max={1000000}
                  aria-label="Fund amount"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFundModal(false);
                      setFundAmount("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFund}
                    disabled={isFunding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
                  >
                    {isFunding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Fund"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div>
                {bankLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-muted" />
                    <p className="text-sm text-muted">Loading account details...</p>
                  </div>
                ) : bankAccount ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted">
                      Transfer any amount to this account. Your wallet will be credited automatically.
                    </p>

                    <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted">Bank Name</p>
                          <p className="text-sm font-semibold">{bankAccount.bankName}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted">Account Number</p>
                          <p className="text-lg font-bold tracking-wider">{bankAccount.accountNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={copyAccountNumber}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Account Name</p>
                        <p className="text-sm font-semibold">{bankAccount.accountName}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted text-center">
                      Transfers are processed within 1-5 minutes
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-10 h-10 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">Could not load account details</p>
                    <button
                      type="button"
                      onClick={fetchBankAccount}
                      className="mt-2 text-sm text-accent hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowFundModal(false);
                    setFundTab("card");
                  }}
                  className="w-full mt-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface-elevated transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
        {txnLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-muted mx-auto mb-2" />
            <p className="text-muted">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => {
              const isCredit = txn.type === "funding" || txn.type === "reversal";
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{txn.description}</p>
                      <p className="text-xs text-muted">{formatDate(txn.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isCredit ? "text-emerald" : "text-red-500"
                      }`}
                    >
                      {isCredit ? "+" : "-"}{formatNaira(txn.amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        txn.status === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : txn.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

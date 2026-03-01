"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Printer,
  Share2,
  Zap,
  Phone,
  Wifi,
  Tv,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ReceiptData {
  reference: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  customer: string;
  metadata: {
    phone?: string;
    network?: string;
    token?: string;
    plan_name?: string;
  };
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  airtime: <Phone className="w-6 h-6" />,
  data: <Wifi className="w-6 h-6" />,
  electricity: <Zap className="w-6 h-6" />,
  cable: <Tv className="w-6 h-6" />,
  exam_pin: <GraduationCap className="w-6 h-6" />,
  funding: <Zap className="w-6 h-6" />,
};

const TYPE_LABELS: Record<string, string> = {
  airtime: "Airtime Purchase",
  data: "Data Bundle",
  electricity: "Electricity Payment",
  cable: "Cable TV Subscription",
  exam_pin: "Exam Pin Purchase",
  funding: "Wallet Funding",
  reversal: "Reversal",
  transfer: "Transfer",
};

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function ReceiptPage() {
  const { reference } = useParams<{ reference: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!reference) return;
    fetch(`/api/receipts/${reference}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setReceipt)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !receipt) {
    return (
      <div className="min-h-screen bg-[#f4f4f7] flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h1>
          <p className="text-gray-500 mb-6">This transaction reference does not exist.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1128] text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = receipt.status === "success";
  const isFailed = receipt.status === "failed";

  const statusConfig = isSuccess
    ? { icon: <CheckCircle2 className="w-12 h-12" />, color: "text-emerald-500", bg: "bg-emerald-50", label: "Successful" }
    : isFailed
      ? { icon: <XCircle className="w-12 h-12" />, color: "text-red-500", bg: "bg-red-50", label: "Failed" }
      : { icon: <Clock className="w-12 h-12" />, color: "text-amber-500", bg: "bg-amber-50", label: "Processing" };

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `JWTelecoms Receipt — ${receipt!.reference}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Receipt link copied!");
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: "Transaction Type", value: TYPE_LABELS[receipt.type] || receipt.type },
    { label: "Description", value: receipt.description },
    { label: "Amount", value: formatNaira(receipt.amount) },
    { label: "Status", value: statusConfig.label },
    { label: "Reference", value: receipt.reference },
    { label: "Customer", value: receipt.customer },
    { label: "Date", value: formatDate(receipt.date) },
  ];

  if (receipt.metadata.phone) {
    rows.splice(2, 0, { label: "Phone Number", value: receipt.metadata.phone });
  }
  if (receipt.metadata.network) {
    rows.splice(3, 0, { label: "Network", value: receipt.metadata.network.toUpperCase() });
  }
  if (receipt.metadata.token) {
    rows.push({ label: "Token/PIN", value: receipt.metadata.token });
  }

  return (
    <div className="min-h-screen bg-[#f4f4f7] flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="w-full max-w-md">
        {/* Receipt Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-[#0A1128] px-6 py-6 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00E5A0]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                JW<span className="text-[#00E5A0]">Telecoms</span>
              </span>
            </div>
            <p className="text-white/50 text-xs">Transaction Receipt</p>
          </div>

          {/* Status */}
          <div className="flex flex-col items-center py-6 border-b border-gray-100">
            <div className={`${statusConfig.bg} ${statusConfig.color} w-20 h-20 rounded-full flex items-center justify-center mb-3`}>
              {statusConfig.icon}
            </div>
            <p className={`text-lg font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatNaira(receipt.amount)}</p>
          </div>

          {/* Service icon + type */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-[#0A1128]/5 flex items-center justify-center text-[#0A1128]">
              {TYPE_ICONS[receipt.type] || <Zap className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{TYPE_LABELS[receipt.type] || receipt.type}</p>
              <p className="text-xs text-gray-500">{receipt.description}</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-0">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-500">{row.label}</span>
                <span
                  className={`text-sm font-medium text-gray-900 text-right max-w-[60%] break-all ${
                    row.label === "Token/PIN" ? "font-mono text-base font-bold text-emerald-600" : ""
                  } ${row.label === "Reference" ? "font-mono text-xs" : ""}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div className="px-6">
            <div className="border-t-2 border-dashed border-gray-200" />
          </div>

          {/* Footer */}
          <div className="px-6 py-5 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              This is an electronic receipt from JWTelecoms.
              <br />
              For support, contact us at support@jwtelecoms.com
            </p>
          </div>
        </div>

        {/* Action buttons (hidden when printing) */}
        <div className="flex gap-3 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleShare}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0A1128] rounded-xl text-sm font-semibold text-white hover:bg-[#0A1128]/90 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Back link */}
        <div className="text-center mt-4 print:hidden">
          <Link href="/transactions" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}

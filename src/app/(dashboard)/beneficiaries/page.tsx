"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, Loader2, Phone, Wifi, Zap, Tv, GraduationCap } from "lucide-react";

interface Beneficiary {
  id: string;
  label: string;
  service_type: string;
  identifier: string;
  network: string | null;
  created_at: string;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  airtime: <Phone size={16} />,
  data: <Wifi size={16} />,
  electricity: <Zap size={16} />,
  cable: <Tv size={16} />,
  exam_pin: <GraduationCap size={16} />,
};

const SERVICE_LABELS: Record<string, string> = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  cable: "Cable TV",
  exam_pin: "Exam Pins",
};

const NETWORKS = ["mtn", "airtel", "glo", "9mobile"];

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Form
  const [label, setLabel] = useState("");
  const [serviceType, setServiceType] = useState("airtime");
  const [identifier, setIdentifier] = useState("");
  const [network, setNetwork] = useState("");

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json();
      if (res.ok) setBeneficiaries(data.beneficiaries || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          serviceType,
          identifier: identifier.trim(),
          network: (serviceType === "airtime" || serviceType === "data") ? network : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setBeneficiaries((prev) => [data.beneficiary, ...prev]);
      setShowAdd(false);
      setLabel("");
      setIdentifier("");
      setNetwork("");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/beneficiaries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  }

  const showNetwork = serviceType === "airtime" || serviceType === "data";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Beneficiaries</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-navy font-semibold rounded-xl text-sm hover:bg-accent-bright transition-colors active:scale-[0.98]"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      {/* Add form modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-bold">Add Beneficiary</h2>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. My MTN Line"
                maxLength={50}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              >
                {Object.entries(SERVICE_LABELS).map(([val, lab]) => (
                  <option key={val} value={val}>{lab}</option>
                ))}
              </select>
            </div>

            {showNetwork && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                >
                  <option value="">Select network</option>
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>{n.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                {serviceType === "electricity" ? "Meter Number" : serviceType === "cable" ? "Smartcard Number" : "Phone Number"}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={serviceType === "electricity" ? "Enter meter number" : serviceType === "cable" ? "Enter smartcard number" : "08012345678"}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted mx-auto mb-2" />
          <p className="text-muted">No beneficiaries saved yet</p>
          <p className="text-sm text-muted mt-1">Save frequently used numbers for quick access</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                  {SERVICE_ICONS[b.service_type] || <Users size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{b.label}</p>
                  <p className="text-xs text-muted truncate">
                    {b.identifier}
                    {b.network && <span className="ml-1 uppercase">({b.network})</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={deleting === b.id}
                className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                aria-label={`Delete ${b.label}`}
              >
                {deleting === b.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

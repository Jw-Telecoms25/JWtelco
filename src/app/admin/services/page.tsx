"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import type { Service } from "@/lib/services/types";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  async function fetchServices() {
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      addToast({ type: "error", title: "Failed to load services" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleService(id: string, enabled: boolean) {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error();
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
      addToast({
        type: "success",
        title: `Service ${enabled ? "enabled" : "disabled"}`,
      });
    } catch {
      addToast({ type: "error", title: "Failed to update service" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Services</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-surface rounded-xl border border-border p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">{service.name}</h3>
              </div>
              <button
                onClick={() => toggleService(service.id, !service.enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  service.enabled ? "bg-emerald" : "bg-muted/40"
                }`}
                aria-label={`Toggle ${service.name}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    service.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-muted mb-2">{service.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>Slug: {service.slug}</span>
              <span>Provider: {service.provider}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

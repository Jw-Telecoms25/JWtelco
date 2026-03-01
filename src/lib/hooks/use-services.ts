"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import type { Service, PricingPlan } from "@/lib/services/types";

export function useServices() {
  const supabase = useSupabase();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .eq("enabled", true)
      .then(({ data }) => {
        if (data) setServices(data as Service[]);
        setIsLoading(false);
      });
  }, [supabase]);

  return { services, isLoading };
}

export function usePricing(serviceSlug: string, network?: string) {
  const supabase = useSupabase();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      // First get service ID
      const { data: service } = await supabase
        .from("services")
        .select("id")
        .eq("slug", serviceSlug)
        .single();

      if (!service) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from("pricing")
        .select("*")
        .eq("service_id", service.id)
        .eq("enabled", true)
        .order("user_price", { ascending: true });

      if (network) {
        query = query.eq("network", network);
      }

      const { data } = await query;
      if (data) setPlans(data as PricingPlan[]);
      setIsLoading(false);
    }
    load();
  }, [supabase, serviceSlug, network]);

  return { plans, isLoading };
}

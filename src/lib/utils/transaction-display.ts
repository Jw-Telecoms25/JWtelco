import {
  Phone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
} from "lucide-react";
import { createElement } from "react";
import type { TransactionType, TransactionStatus } from "@/lib/services/types";
import type { BadgeVariant } from "@/components/ui/Badge";

export const typeIcons: Record<TransactionType, React.ReactNode> = {
  airtime: createElement(Phone, { size: 16 }),
  data: createElement(Wifi, { size: 16 }),
  electricity: createElement(Zap, { size: 16 }),
  cable: createElement(Tv, { size: 16 }),
  exam_pin: createElement(GraduationCap, { size: 16 }),
  funding: createElement(ArrowDownLeft, { size: 16 }),
  transfer: createElement(ArrowUpRight, { size: 16 }),
  reversal: createElement(Repeat, { size: 16 }),
};

export const typeColors: Record<TransactionType, string> = {
  airtime: "bg-blue-50 text-blue-600",
  data: "bg-purple-50 text-purple-600",
  electricity: "bg-amber-50 text-amber-600",
  cable: "bg-emerald-50 text-emerald-600",
  exam_pin: "bg-rose-50 text-rose-600",
  funding: "bg-green-50 text-green-600",
  transfer: "bg-orange-50 text-orange-600",
  reversal: "bg-gray-50 text-gray-600",
};

export const statusBadge: Record<TransactionStatus, BadgeVariant> = {
  success: "success",
  pending: "warning",
  processing: "info",
  failed: "error",
  reversed: "default",
};

export const creditTypes: TransactionType[] = ["funding", "reversal"];

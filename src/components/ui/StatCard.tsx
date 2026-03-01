import { type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  className = "",
}: StatCardProps) {
  return (
    <Card className={`flex items-start gap-4 ${className}`}>
      <div className="flex-shrink-0 p-2.5 rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted truncate">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {trend && (
          <div
            className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              trend.direction === "up" ? "text-emerald" : "text-red-500"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{trend.percentage}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export type { StatCardProps };

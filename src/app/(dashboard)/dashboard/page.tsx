import { WalletCard } from "@/components/dashboard/WalletCard";
import { QuickBuy } from "@/components/dashboard/QuickBuy";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export const metadata = {
  title: "Dashboard — JWTelecoms",
};

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <WalletCard />
      <QuickBuy />
      <RecentTransactions />
    </div>
  );
}

import { WalletCard } from "@/components/dashboard/WalletCard";
import { QuickBuy } from "@/components/dashboard/QuickBuy";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PinSetupBanner } from "@/components/dashboard/PinSetupBanner";

export const metadata = {
  title: "Dashboard — JWTelecoms",
};

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PinSetupBanner />
      <WalletCard />
      <QuickBuy />
      <RecentTransactions />
    </div>
  );
}

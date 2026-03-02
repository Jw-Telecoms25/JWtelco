import Link from "next/link";

export const metadata = {
  title: "Terms of Service — JWTelecoms",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-navy mb-8">Terms of Service</h1>

        <div className="prose prose-sm text-muted space-y-6">
          <p><strong>Effective Date:</strong> March 2026</p>

          <h2 className="text-lg font-semibold text-navy">1. Acceptance of Terms</h2>
          <p>By accessing and using JWTelecoms, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

          <h2 className="text-lg font-semibold text-navy">2. Services</h2>
          <p>JWTelecoms provides a platform for purchasing airtime, data bundles, electricity tokens, cable TV subscriptions, and exam pins for Nigerian networks and service providers.</p>

          <h2 className="text-lg font-semibold text-navy">3. Account Registration</h2>
          <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>

          <h2 className="text-lg font-semibold text-navy">4. Wallet & Payments</h2>
          <p>Funds added to your JWTelecoms wallet are non-refundable except in cases of failed transactions, which are automatically reversed. All transactions are final once successfully processed.</p>

          <h2 className="text-lg font-semibold text-navy">5. Prohibited Use</h2>
          <p>You may not use JWTelecoms for fraudulent activities, money laundering, or any illegal purpose. We reserve the right to suspend or terminate accounts that violate these terms.</p>

          <h2 className="text-lg font-semibold text-navy">6. Limitation of Liability</h2>
          <p>JWTelecoms is not liable for service interruptions caused by third-party providers (network operators, payment processors). We will make reasonable efforts to resolve issues promptly.</p>

          <h2 className="text-lg font-semibold text-navy">7. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:support@jwtelecoms.com.ng" className="text-accent hover:underline">support@jwtelecoms.com.ng</a></p>
        </div>
      </div>
    </div>
  );
}

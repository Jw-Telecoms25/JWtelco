import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — JWTelecoms",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-navy mb-8">Privacy Policy</h1>

        <div className="prose prose-sm text-muted space-y-6">
          <p><strong>Effective Date:</strong> March 2026</p>

          <h2 className="text-lg font-semibold text-navy">1. Information We Collect</h2>
          <p>We collect your name, email address, phone number, and transaction history when you use JWTelecoms. Payment information is processed securely by our payment partners (Paystack, Aspfiy) and is never stored on our servers.</p>

          <h2 className="text-lg font-semibold text-navy">2. How We Use Your Information</h2>
          <p>Your information is used to: process transactions, send receipts and notifications, prevent fraud, and improve our services. We do not sell your personal data to third parties.</p>

          <h2 className="text-lg font-semibold text-navy">3. Data Security</h2>
          <p>We use industry-standard encryption and security measures to protect your data. All API communications are encrypted via HTTPS.</p>

          <h2 className="text-lg font-semibold text-navy">4. Notifications</h2>
          <p>You may receive email notifications about transactions and account activity. You can manage your notification preferences in your profile settings.</p>

          <h2 className="text-lg font-semibold text-navy">5. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. Transaction records are kept for regulatory compliance purposes.</p>

          <h2 className="text-lg font-semibold text-navy">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting us. Account deletion will result in loss of wallet balance.</p>

          <h2 className="text-lg font-semibold text-navy">7. Contact</h2>
          <p>For privacy-related inquiries, contact us at <a href="mailto:support@jwtelecoms.com.ng" className="text-accent hover:underline">support@jwtelecoms.com.ng</a></p>
        </div>
      </div>
    </div>
  );
}

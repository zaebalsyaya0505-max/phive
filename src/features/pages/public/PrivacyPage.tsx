import { Link } from 'react-router';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[800px] mx-auto px-6 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-phantom-purple transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-phantom-purple" />
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-white/60 text-sm leading-relaxed">
          <p className="text-white/40 text-xs">Last updated: May 2026</p>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Data Collection</h2>
            <p>Phantom collects minimal data necessary for platform functionality. This includes your TON wallet address (used solely for authentication), profile display name, and user-generated content (notes, posts). We do not collect, store, or transmit private keys, seed phrases, or any sensitive wallet credentials.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Data Usage</h2>
            <p>Collected data is used exclusively for: authentication and session management, personalization of your experience, platform security and abuse prevention, and communication regarding service updates.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal data. Data may be shared only with service providers essential to platform operation (e.g., Supabase for database hosting, TON blockchain for wallet verification), and only to the extent necessary.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Data Storage & Security</h2>
            <p>All data is encrypted at rest and in transit. Authentication tokens are stored locally on your device. TON wallet signatures are verified on the server and never stored in plain text.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Your Rights</h2>
            <p>You may request deletion of your account and associated data at any time through your profile settings. You may also export your data in a machine-readable format.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Contact</h2>
            <p>For privacy-related inquiries, contact us at <span className="text-phantom-purple">privacy@phantom.net</span>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

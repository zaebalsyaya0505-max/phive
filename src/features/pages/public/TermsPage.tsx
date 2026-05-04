import { Link } from 'react-router';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[800px] mx-auto px-6 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-phantom-purple transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-phantom-purple" />
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="space-y-6 text-white/60 text-sm leading-relaxed">
          <p className="text-white/40 text-xs">Last updated: May 2026</p>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Phantom, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old or have parental/guardian consent to use Phantom. You are responsible for maintaining the security of your TON wallet credentials.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Acceptable Use</h2>
            <p>You may not use Phantom for illegal activities, distributing malware, spamming or harassment, impersonating others, or attempting to compromise platform security.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Content</h2>
            <p>You retain ownership of content you create. By posting, you grant Phantom a license to display and distribute your content within the platform. You are responsible for ensuring your content does not violate third-party rights.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Disclaimers</h2>
            <p>Phantom is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, data loss prevention, or compatibility with all wallet providers. Use at your own risk.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Limitation of Liability</h2>
            <p>Phantom and its developers shall not be liable for any indirect, incidental, or consequential damages arising from platform use, including loss of data, wallet access, or digital assets.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may discontinue use at any time by disconnecting your wallet and requesting data deletion.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Changes</h2>
            <p>We may update these terms with notice posted on the platform. Continued use after changes constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

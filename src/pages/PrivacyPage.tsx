import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-text-secondary mb-12">
            Last updated: December 1, 2025
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">1. Information We Collect</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Account information (name, email, company details)</li>
                <li>Property addresses and photos you upload or access via MLS</li>
                <li>Moving inventory data and quotes you create</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">2. How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide, maintain, and improve the MovSense service</li>
                <li>Process AI furniture detection and generate quotes</li>
                <li>Process payments and send billing statements</li>
                <li>Send service updates, security alerts, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our AI models</li>
                <li>Detect and prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">3. AI and Photo Processing</h2>
              <p className="text-text-secondary leading-relaxed">
                When you use MovSense's AI detection features, property photos are processed by our AI models
                to identify furniture and estimate moving requirements. Photos are stored securely and used
                only for providing the service and improving our AI accuracy. We do not sell or share your
                photos with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">4. Information Sharing</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With vendors who perform services on our behalf (hosting, analytics, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                <li><strong>With Your Consent:</strong> When you direct us to share information</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">5. Data Security</h2>
              <p className="text-text-secondary leading-relaxed">
                We implement appropriate technical and organizational measures to protect your information,
                including encryption, secure servers, and access controls. However, no method of transmission
                over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">6. Data Retention</h2>
              <p className="text-text-secondary leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide
                services. You may request deletion of your data at any time by contacting us. Some information
                may be retained for legal or legitimate business purposes after account closure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">7. Your Rights</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@movsense.com" className="text-primary hover:underline">
                  privacy@movsense.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">8. Cookies and Tracking</h2>
              <p className="text-text-secondary leading-relaxed">
                We use cookies and similar tracking technologies to collect usage information and improve
                your experience. You can control cookies through your browser settings, though some features
                may not function properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">9. Third-Party Services</h2>
              <p className="text-text-secondary leading-relaxed">
                MovSense integrates with third-party services (payment processors, analytics providers,
                AI services). These services have their own privacy policies, and we encourage you to
                review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">10. Children's Privacy</h2>
              <p className="text-text-secondary leading-relaxed">
                MovSense is not intended for use by children under 13. We do not knowingly collect
                information from children under 13. If we learn we have collected such information,
                we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">11. International Data Transfers</h2>
              <p className="text-text-secondary leading-relaxed">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">12. Changes to Privacy Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes
                via email or through the service. Your continued use after changes constitutes acceptance
                of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">13. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                For questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-surface p-6 rounded-lg border border-border mt-4">
                <p className="text-text-secondary">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@movsense.com" className="text-primary hover:underline">
                    privacy@movsense.com
                  </a>
                </p>
                <p className="text-text-secondary mt-2">
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@movsense.com" className="text-primary hover:underline">
                    support@movsense.com
                  </a>
                </p>
              </div>
            </section>

            <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 mt-12">
              <p className="text-sm text-text-secondary">
                <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and handling
                your data responsibly. If you have any concerns about how your information is used, please
                don't hesitate to reach out.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

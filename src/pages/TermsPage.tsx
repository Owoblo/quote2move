import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary mb-12">
            Last updated: December 1, 2025
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">1. Acceptance of Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                By accessing and using MovSense ("the Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these Terms of Service, please do not
                use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">2. Description of Service</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                MovSense provides AI-powered moving quote generation software that analyzes property photos to
                detect furniture and generate accurate moving estimates. The Service includes:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>AI-powered furniture detection from property photos</li>
                <li>Automated inventory generation</li>
                <li>Quote and estimate calculation tools</li>
                <li>Customer communication features</li>
                <li>Project management and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">3. User Accounts</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To use the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">4. Acceptable Use</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Reproduce, duplicate, copy, or resell any part of the Service</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">5. Subscription and Payment</h2>
              <p className="text-text-secondary leading-relaxed">
                Paid subscriptions are billed on a recurring basis. You authorize us to charge your payment
                method for all fees. Subscriptions automatically renew unless cancelled before the renewal date.
                You may cancel your subscription at any time, and you will continue to have access until the
                end of your billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">6. AI Accuracy Disclaimer</h2>
              <p className="text-text-secondary leading-relaxed">
                While MovSense uses advanced AI technology to detect furniture and estimate moving requirements,
                we do not guarantee 100% accuracy. The Service is a tool to assist with quote generation, and
                users should verify and adjust AI-generated inventories as needed. MovSense is not responsible
                for any losses resulting from inaccurate estimates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">7. Intellectual Property</h2>
              <p className="text-text-secondary leading-relaxed">
                The Service and its original content, features, and functionality are owned by MovSense and are
                protected by international copyright, trademark, and other intellectual property laws. You retain
                ownership of data you input into the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">8. Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                MovSense shall not be liable for any indirect, incidental, special, consequential, or punitive
                damages resulting from your use of or inability to use the Service. Our total liability shall not
                exceed the amount you paid for the Service in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">9. Termination</h2>
              <p className="text-text-secondary leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior
                notice, for any reason, including breach of these Terms. Upon termination, your right to use
                the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">10. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material
                changes via email or through the Service. Your continued use of the Service after changes
                constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4">11. Contact</h2>
              <p className="text-text-secondary leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:support@movsense.com" className="text-primary hover:underline">
                  support@movsense.com
                </a>
              </p>
            </section>

            <div className="bg-surface p-6 rounded-lg border border-border mt-12">
              <p className="text-sm text-text-secondary">
                By using MovSense, you acknowledge that you have read, understood, and agree to be bound by
                these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

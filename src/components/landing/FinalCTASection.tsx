import React from 'react';

export default function FinalCTASection() {
  return (
    <section className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
          See MovSense in action.
        </h2>
        <p className="text-lg text-[#374151] mb-10 max-w-2xl mx-auto">
          Book a 15-minute demo. We’ll run MovSense on your real listings, show exact time & cost savings, and hand you free trial access (no credit card).
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://calendly.com"
            className="px-8 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
          >
            Book demo now
          </a>
          <a
            href="/login"
            className="px-8 py-3 border border-gray-300 text-[#111827] rounded-lg font-semibold hover:border-gray-400 transition"
          >
            Or start free trial
          </a>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 space-y-2">
          <p>Questions? Text us at (555) 555-1212 — we reply in under 10 minutes during business hours.</p>
          <p>Prefer email? <a href="mailto:support@movsense.com" className="text-accent underline">support@movsense.com</a></p>
        </div>
      </div>
    </section>
  );
}


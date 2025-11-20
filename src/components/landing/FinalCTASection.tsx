import React from 'react';

export default function FinalCTASection() {
  return (
    <section className="py-24 bg-slate-900">
      <div className="container-max mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          See MovSense in action.
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
          Book a 15-minute demo. We’ll run MovSense on your real listings, show exact time & cost savings, and hand you free trial access (no credit card).
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://calendly.com"
            className="btn btn-primary px-8 py-3 text-base text-center"
          >
            Book demo now
          </a>
          <a
            href="/login"
            className="btn btn-secondary px-8 py-3 text-base text-center"
          >
            Or start free trial
          </a>
        </div>

        <div className="text-sm text-slate-400 mt-8 space-y-2">
          <p>Questions? Text us at (800) 555-0199 — we reply in under 10 minutes during business hours.</p>
          <p>Prefer email? <a href="mailto:support@movsense.com" className="text-accent underline">support@movsense.com</a></p>
        </div>
      </div>
    </section>
  );
}


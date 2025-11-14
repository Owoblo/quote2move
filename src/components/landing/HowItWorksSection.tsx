import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      title: '1️⃣ Paste the address',
      description: 'Type in the property address or paste the MLS link. MovSense instantly pulls every listing photo for you—no downloading, no uploads.'
    },
    {
      title: '2️⃣ Review the inventory (30 seconds)',
      description: 'MovSense detects every couch, bed, appliance, and box. Add or remove anything before you finalize so you stay in control.'
    },
    {
      title: '3️⃣ Send the quote',
      description: 'Export to PDF, email, or drop it into your CRM. Customers get a professional quote in minutes and you never left the office.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Quote in 3 steps—no driving required.
          </h2>
          <p className="text-lg text-[#374151] max-w-2xl mx-auto">
            Average time: 2-5 minutes per quote (vs. 45-90 minutes for traditional walkthroughs).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <h3 className="text-xl font-semibold text-[#111827] mb-3">
                {step.title}
              </h3>
              <p className="text-[#374151] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      title: 'Paste the address',
      description: 'Type in the property address or paste the MLS link. MovSense instantly pulls every listing photo for you—no downloading, no uploads.',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      )
    },
    {
      title: 'Review inventory (30s)',
      description: 'MovSense detects every couch, bed, appliance, and box. Add or remove anything before you finalize so you stay in control.',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
      )
    },
    {
      title: 'Send the quote',
      description: 'Export to PDF, email, or drop it into your CRM. Customers get a professional quote in minutes and you never left the office.',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="section-padding bg-surface relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent transform -translate-y-1/2 hidden md:block"></div>
      
      <div className="container-max relative z-10">
        <div className="text-center mb-20">
          <div className="chip mb-4">Workflow</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Quote in 3 steps—<span className="text-primary">no driving required</span>.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Average time: 2-5 minutes per quote (vs. 45-90 minutes for traditional walkthroughs).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Step connector line for mobile */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-px bg-border md:hidden"></div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 relative">
                  {/* Number badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold text-text-primary shadow-sm">
                    {index + 1}
                  </div>
                  {step.icon}
                </div>
                
                <h3 className="text-xl font-bold text-text-primary mb-4 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

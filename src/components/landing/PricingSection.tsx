import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$199',
      cadence: '/mo',
      highlight: 'Perfect for 1-3 trucks',
      mostPopular: false,
      perks: [
        'Up to 100 quotes per month',
        '1 user seat',
        'All core features',
        'Email support',
        '$1.50 per additional quote'
      ],
      cta: 'Start free trial'
    },
    {
      name: 'Pro',
      price: '$399',
      cadence: '/mo',
      highlight: 'Perfect for 4-10 trucks',
      mostPopular: true,
      perks: [
        'Up to 300 quotes per month',
        '5 user seats',
        'Analytics dashboard',
        'Priority support',
        '$1.00 per additional quote'
      ],
      cta: 'Start free trial'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      cadence: '',
      highlight: 'Multi-location & national fleets',
      mostPopular: false,
      perks: [
        'Unlimited quotes',
        'Unlimited users',
        'CRM & dispatch integrations',
        'Dedicated success manager',
        'Custom training + rollout'
      ],
      cta: 'Contact sales'
    }
  ];
  return (
    <section id="pricing" className="section-padding bg-background">
      <div className="container-max mx-auto px-6">
        <div className="text-center mb-16">
          <div className="chip mb-4">Pricing</div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Early access pricing.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Simple pricing for early movers. No contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 relative flex flex-col ${
                plan.mostPopular 
                  ? 'border-primary ring-2 ring-primary/20 shadow-xl scale-105 z-10' 
                  : 'border-border shadow-lg'
              }`}
            >
              {plan.mostPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-lg shadow-primary/20">
                  Most popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
              <p className="text-sm text-text-muted mb-6 font-medium">{plan.highlight}</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-text-primary tracking-tight">{plan.price}</span>
                <span className="text-text-secondary font-medium">{plan.cadence}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-text-primary">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span className="text-sm">{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`block text-center px-6 py-3 font-bold rounded-xl transition-all duration-200 ${
                  plan.mostPopular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center text-text-secondary text-sm mt-12 space-y-2">
          <p>💡 Not sure where to start? Pick Starter—upgrade anytime.</p>
          <p>📞 Prefer to talk? <a href="https://calendly.com" className="text-primary hover:underline font-medium">Book a 15-min call</a> or email <a href="mailto:sales@movsense.com" className="text-primary hover:underline">sales@movsense.com</a>.</p>
        </div>
      </div>
    </section>
  );
}

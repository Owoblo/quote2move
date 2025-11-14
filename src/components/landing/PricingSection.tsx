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
    <section id="pricing" className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Early access pricing.
          </h2>
          <p className="text-lg text-[#374151] max-w-2xl mx-auto">
            Simple pricing for early movers. No contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 bg-white dark:bg-gray-900 shadow-lg ${
                plan.mostPopular ? 'border-accent ring-2 ring-accent/30 relative' : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {plan.mostPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                  Most popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-[#111827] mb-2">{plan.name}</h3>
              <p className="text-sm text-[#6B7280] mb-6">{plan.highlight}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-[#111827]">{plan.price}</span>
                <span className="text-[#374151]">{plan.cadence}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-[#111827]">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`block text-center px-6 py-3 font-semibold rounded-lg transition-all ${
                  plan.mostPopular
                    ? 'bg-accent text-white hover:bg-accent-dark'
                    : 'border border-gray-200 hover:border-gray-300 text-[#111827]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center text-[#374151] text-sm mt-10 space-y-2">
          <p>💡 Not sure where to start? Pick Starter—upgrade anytime.</p>
          <p>📞 Prefer to talk? <a href="https://calendly.com" className="text-accent underline">Book a 15-min call</a> or email sales@movsense.com.</p>
        </div>
      </div>
    </section>
  );
}


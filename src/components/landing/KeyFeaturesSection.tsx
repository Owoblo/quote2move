import React from 'react';

export default function KeyFeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Photo to inventory AI',
      description: 'Detects furniture and items automatically from listing photos.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Accurate quoting engine',
      description: 'Uses volume, distance, and your pricing rules to generate precise quotes.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Team friendly workflow',
      description: 'Let sales reps, dispatchers, and estimators work from the same source of truth.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics and calibration',
      description: 'Compare estimated vs actual move data so your quotes get smarter over time.'
    }
  ];

  return (
    <section id="product" className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Everything your sales team needs to quote in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 container-max mx-auto mb-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900"
            >
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6 text-accent dark:text-accent-light">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#374151] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 shadow-lg text-left">
          <div className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4">Manual override built in</div>
          <h3 className="text-3xl font-bold text-[#111827] mb-4">
            AI gets it 96% right. You stay in control of the other 4%.
          </h3>
          <p className="text-lg text-[#374151] mb-6">
            Add attic items, remove duplicates, tweak quantities, or override pricing before the quote goes out. MovSense handles the grunt work—you make the final call.
          </p>
          <ul className="space-y-3 text-[#111827]">
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-1">✓</span>
              <span>Add missing rooms (garage, shed, storage)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-1">✓</span>
              <span>Remove or merge anything the AI mislabels</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-1">✓</span>
              <span>Adjust rates and surcharges before sending</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}


import React from 'react';

export default function UseCasesSection() {
  const useCases = [
    {
      title: 'For owners',
      description: 'Standardize quoting, protect margins, and stop leaving money on the table.'
    },
    {
      title: 'For sales reps',
      description: 'Stop driving for walkthroughs. Open a link, run MovSense, send a quote.'
    },
    {
      title: 'For dispatchers',
      description: 'See inventory and estimated hours clearly before assigning trucks and crews.'
    }
  ];

  return (
    <section className="py-24 bg-background dark:bg-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Built for modern moving companies.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <div 
              key={index} 
              className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {useCase.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


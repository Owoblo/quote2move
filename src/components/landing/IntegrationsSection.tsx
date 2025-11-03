import React from 'react';

export default function IntegrationsSection() {
  const integrations = ['CRMs', 'Email tools', 'Zapier', 'Internal dashboards'];

  return (
    <section className="py-24 bg-background dark:bg-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Fits into your existing workflow.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            MovSense plays well with the tools you already use.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {integrations.map((integration, index) => (
            <div 
              key={index}
              className="px-6 py-3 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              {integration}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
          Start with simple exports and webhooks. Add deeper integrations later.
        </p>
      </div>
    </section>
  );
}


import React from 'react';

export default function ResultsSection() {
  const stats = [
    {
      value: '60%',
      label: 'less time spent on quotes'
    },
    {
      value: 'Up to 25%',
      label: 'higher quote accuracy'
    },
    {
      value: '2x',
      label: 'more follow ups sent on time'
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            Quote faster, close more, waste less time.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl text-gray-700 dark:text-gray-300 italic mb-4">
            "MovSense lets our reps send professional quotes without ever stepping into the house."
          </blockquote>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">John Smith</span>, CEO at ABC Moving
          </div>
        </div>
      </div>
    </section>
  );
}


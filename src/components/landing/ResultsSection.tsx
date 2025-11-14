import React from 'react';

export default function ResultsSection() {
  const stats = [
    {
      value: '⏱️ 60% less time on quotes',
      detail: '= 15+ hours saved per rep, per week'
    },
    {
      value: '💰 25% fewer pricing mistakes',
      detail: '= $2,000+ margin protected every month'
    },
    {
      value: '📈 2x more quotes sent',
      detail: '= More bookings without hiring more reps'
    },
    {
      value: '🔥 8x ROI in 30 days',
      detail: 'Average results from teams using MovSense daily'
    }
  ];

  return (
    <section className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Quote faster, close more, waste less time.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 container-max mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-left shadow-sm">
              <div className="text-2xl font-bold text-[#111827] mb-2">
                {stat.value}
              </div>
              <div className="text-[#374151]">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl text-[#374151] italic mb-4">
            "MovSense lets our reps send professional quotes without ever stepping into the house."
          </blockquote>
          <div className="text-[#374151]">
            <span className="font-semibold">John Smith</span>, CEO at ABC Moving
          </div>
        </div>
      </div>
    </section>
  );
}


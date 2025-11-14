import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What if the AI misses something?',
      answer: 'MovSense detects ~96% of items from MLS photos. You can manually add garage/shed/attic items or custom pieces in seconds before you send the quote—still 10x faster than a walkthrough.'
    },
    {
      question: 'Do I still need to do walkthroughs?',
      answer: 'For small-to-medium moves, MovSense covers everything from the listing. For huge or specialty jobs, use MovSense for the first pass, then schedule an in-person walkthrough only for serious leads.'
    },
    {
      question: 'What if my customer doesn’t have MLS photos?',
      answer: 'They can upload their own photos or send you a Google Drive/iPhone link. MovSense works with any property photos, not just MLS.'
    },
    {
      question: 'How long does setup take?',
      answer: 'About 5 minutes. Enter your hourly or cubic-foot pricing, travel fees, and crew sizes. No complex integrations required.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. Month-to-month plans, no long-term contracts, no cancellation fees. Downgrade or cancel with one click.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-[#F3F4F6]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-[#111827] pr-8">
                  {faq.question}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 pt-0 text-[#374151]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


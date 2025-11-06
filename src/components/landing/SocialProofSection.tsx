import React from 'react';

export default function SocialProofSection() {
  return (
    <section className="py-8 bg-[#F3F4F6] border-y border-[#E5E7EB]">
      <div className="container-max mx-auto px-6">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Used by growing moving companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {/* Placeholder logos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="w-24 h-12 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">Company {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


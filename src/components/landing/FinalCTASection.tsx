import React, { useState } from 'react';

export default function FinalCTASection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - could redirect to login or show success message
    window.location.href = '/login';
  };

  return (
    <section className="py-24 bg-[#F3F4F6]">
      <div className="container-max mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
          See MovSense in action.
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Give your team AI powered quotes from listing photos.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Request early access
            </button>
          </div>
        </form>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          We will reach out with a short intro call and a live demo.
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Questions? Email us at{' '}
          <a 
            href="mailto:support@movsense.com" 
            className="text-accent hover:text-accent-dark font-medium underline"
          >
            support@movsense.com
          </a>
        </p>
      </div>
    </section>
  );
}


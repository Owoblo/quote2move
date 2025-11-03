import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 px-6 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <div>
            {/* Small pill */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-6">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">AI for moving companies</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.1] mb-6">
              Turn listing photos into precise moving quotes.
            </h1>

            {/* Subtext */}
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
              MovSense uses AI to analyze MLS listings and photos, detect furniture and items, build an inventory, and generate accurate moving quotes in seconds. No walkthroughs, no spreadsheets, no guesswork.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get early access
              </Link>
              <button 
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-base transition-all duration-200"
              >
                Watch product demo
              </button>
            </div>

            {/* Trust text */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built for local and regional moving companies.
            </p>
          </div>

          {/* Right side: Mock dashboard card */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
              {/* Top: MLS listing URL field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MLS listing URL
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    https://mls.example.com/listings/12345
                  </span>
                </div>
              </div>

              {/* Middle: Photo preview grid */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center"
                    >
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Auto detected inventory and quote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto detected inventory */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Auto detected inventory
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Living room:</span> 1 sofa, 1 TV stand, 1 coffee table
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Bedroom:</span> 1 queen bed, 2 side tables
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Kitchen:</span> 1 refrigerator, 1 dishwasher
                    </div>
                  </div>
                </div>

                {/* Quote estimate */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Quote estimate
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Estimated hours:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">4.5 hrs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Estimated cost:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">$675</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


import React from 'react';
import { Link } from 'react-router-dom';
import InteractiveDemo from './InteractiveDemo';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 px-6 bg-background dark:bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <div>
            {/* Small pill */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 mb-6">
              <span className="text-sm font-medium text-accent dark:text-accent-light">AI for moving companies</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary dark:text-white tracking-tight leading-[1.1] mb-6">
              Turn listing photos into precise moving quotes.
            </h1>

            {/* Subtext */}
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
              MovSense uses AI to analyze property addresses, fetch photos automatically, detect furniture and items, build an inventory, and generate accurate moving quotes in seconds. No walkthroughs, no spreadsheets, no guesswork.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get early access
              </Link>
              <button 
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-base transition-all duration-200"
              >
                Watch product demo
              </button>
            </div>

            {/* Trust text */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built for local and regional moving companies.
            </p>
          </div>

          {/* Right side: Interactive Demo */}
          <div className="relative">
            <InteractiveDemo />
          </div>
        </div>
      </div>
    </section>
  );
}


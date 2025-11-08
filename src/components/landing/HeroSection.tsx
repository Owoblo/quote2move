import React from 'react';
import { Link } from 'react-router-dom';
import InteractiveDemo from './InteractiveDemo';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 lg:pt-32 pb-24 lg:pb-36 px-6 bg-[#F3F4F6]">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left side */}
          <div className="flex flex-col gap-8">
            {/* Small pill */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]">
              <span className="text-sm font-medium text-[#2563EB]">AI for moving companies</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl lg:text-[58px] xl:text-[64px] font-bold text-primary dark:text-white tracking-tight leading-[1.05]">
              Turn listing photos into precise moving quotes.
            </h1>

            {/* Subtext */}
            <p className="text-lg lg:text-xl text-[#374151] leading-relaxed max-w-2xl">
              MovSense uses AI to analyze property addresses, fetch photos automatically, detect furniture and items, build an inventory, and generate accurate moving quotes in seconds. No walkthroughs, no spreadsheets, no guesswork.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login" 
                className="btn btn-primary px-8 py-3 text-base"
              >
                Get early access
              </Link>
              <button 
                className="btn btn-secondary px-8 py-3 text-base"
              >
                Watch product demo
              </button>
            </div>

            {/* Trust text */}
            <p className="text-sm text-[#6B7280]">
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


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
            {/* Pain-focused badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#0F172A] text-white text-sm font-medium w-fit">
              Stop wasting hours on free walkthroughs
            </div>

            {/* Main headline */}
            <h1 className="text-5xl lg:text-[58px] xl:text-[64px] font-bold text-primary dark:text-white tracking-tight leading-[1.05]">
              Get accurate moving quotes from just an address—in 30 seconds.
            </h1>

            {/* Subtext */}
            <p className="text-lg lg:text-xl text-[#374151] leading-relaxed max-w-2xl">
              MovSense analyzes MLS photos automatically, detects every item, and builds your inventory so you can quote 10x more jobs without leaving the office. No driving. No spreadsheets. No guessing.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login" 
                className="btn btn-primary px-8 py-3 text-base"
              >
                Try it free — no credit card
              </Link>
              <a 
                href="#demo"
                className="btn btn-secondary px-8 py-3 text-base text-center"
              >
                Watch 2-min demo
              </a>
            </div>

            {/* Trust text */}
            <div className="flex flex-col gap-2 text-sm text-[#6B7280]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[#111827] font-semibold">
                  <span className="text-green-600">✓</span> Used by 50+ moving companies
                </span>
                <span className="hidden sm:inline text-[#D1D5DB]">•</span>
                <span>96% detection accuracy • setup in 5 minutes</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-green-600">✓</span> Quote 10x more jobs without driving
                </span>
                <span className="hidden sm:inline text-[#D1D5DB]">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-green-600">✓</span> 30-second inventory builder
                </span>
              </div>
            </div>
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


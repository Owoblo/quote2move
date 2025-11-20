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
              <a 
                href="https://calendly.com"
                className="btn btn-primary px-8 py-3 text-base text-center"
              >
                Book a Demo
              </a>
              <Link 
                to="/login" 
                className="btn btn-secondary px-8 py-3 text-base"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Logo cloud */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Trusted by leading moving companies
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-start gap-x-8 gap-y-4">
                <img
                  src="/Central Coast Moving logo.webp"
                  alt="Central Coast Moving"
                  className="h-8 w-auto object-contain"
                />
                <img
                  src="/Lets Get Moving Logo.webp"
                  alt="Lets Get Moving"
                  className="h-10 w-auto object-contain"
                />
                <img
                  src="/United-Van-Lines-Company-Logo.gif"
                  alt="United Van Lines"
                  className="h-8 w-auto object-contain"
                />
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


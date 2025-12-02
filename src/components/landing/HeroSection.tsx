import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative pt-24 sm:pt-32 lg:pt-48 pb-16 sm:pb-24 lg:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950"></div>
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
      
      <div className="container-max px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
          {/* Left side */}
          <div className="flex flex-col gap-6 sm:gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700 text-center lg:text-left">
            {/* Pain-focused badge */}
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 w-fit mx-auto lg:mx-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Stop wasting hours on free walkthroughs
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Accurate moving quotes from <span className="text-gradient">just an address</span>.
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              MovSense analyzes MLS photos automatically, detects every item, and builds your inventory so you can quote 10x more jobs without leaving the office.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link 
                to="/login" 
                className="btn btn-primary px-8 py-4 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 w-full sm:w-auto text-center"
              >
                Start Free Trial
              </Link>
              <a
                href="https://movsense.com/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary px-8 py-4 text-base w-full sm:w-auto text-center"
              >
                Watch 2-min demo
              </a>
            </div>

            {/* Trust text */}
            <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 items-center lg:items-start">
              <p className="font-medium text-slate-900 dark:text-slate-300 mb-1">Trusted by 50+ moving companies</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>96% detection accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Quote 10x faster</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Setup in 5 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Interactive Demo */}
          <div className="relative animate-in slide-in-from-right-8 fade-in duration-1000 delay-200">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] opacity-20 blur-2xl dark:opacity-40"></div>
            <div className="relative">
              {/* InteractiveDemo was here, now removed */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => window.open('https://movsense.com/demo', '_blank')}>
                  <img 
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80" 
                    alt="MoveSense Demo" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center pl-1 shadow-lg transform transition-transform group-hover:scale-110">
                      <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-blue-50 dark:bg-blue-900/20 rounded w-20"></div>
                    <div className="h-8 bg-blue-50 dark:bg-blue-900/20 rounded w-20"></div>
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

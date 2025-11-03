import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import MovSenseLogo from '../components/MovSenseLogo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark:bg-primary transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-background/80 dark:bg-primary/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <MovSenseLogo size="md" />
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm transition-colors">
                Pricing
              </Link>
              <ThemeToggle />
              <Link to="/login" className="bg-accent hover:bg-accent-dark text-primary px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 mb-8">
            <span className="text-sm font-medium text-accent dark:text-accent-light">AI that sees what movers can't</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-primary dark:text-white tracking-tight leading-[1.1] mb-6 [-webkit-font-smoothing:antialiased]">
            Turn property photos into
            <span className="block text-accent dark:text-accent-light mt-2">precise moving quotes - instantly</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            MovSense uses AI to analyze real estate listing photos, detect furniture automatically, and generate complete moving inventory with accurate quotes - all in seconds. No walkthroughs. No guesswork. Just pure accuracy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Try MovSense Free
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            <Link 
              to="/pricing" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-base transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>95%+ Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Seconds, Not Hours</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              See It In Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Watch how our AI transforms property photos into accurate moving quotes
            </p>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="aspect-video w-full">
              <iframe
                src="https://www.loom.com/embed/4b0c47c5edff4656a9622c585c5ae62e"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                title="MovSense Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-24 bg-background dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            {/* Old Way */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-red-100 dark:border-red-900/30">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Old Way</h3>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Sales reps waste hours building quotes manually, traveling for estimates, and dealing with inconsistent quoting.
              </p>
            </div>

            {/* New Way */}
            <div className="bg-accent/5 dark:bg-accent/10 rounded-2xl p-8 border-2 border-accent/30 dark:border-accent/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-accent/20 dark:bg-accent/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-primary dark:text-white">New Way</h3>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                MovSense detects every item from MLS photos, builds the inventory automatically, and generates an exact quote instantly.
              </p>
            </div>
          </div>

          {/* Tagline Row */}
          <div className="text-center py-8 border-t border-b border-gray-200 dark:border-gray-700">
            <p className="text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight">
              No walkthroughs. No spreadsheets. No wasted hours.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              AI-powered tools that save time and increase accuracy for moving companies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">Photo-to-Inventory AI</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Detects what's in every photo - furniture, boxes, volume. Vision AI trained on real MLS/home photos with 95%+ accuracy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">Quote Engine</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Builds detailed room-by-room lists in seconds. Calculates distance, weight, and cubic footage automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">Instant Inventory</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Automatically organize detected items by room. Removes human error and saves hours of back-and-forth.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">CRM + Email Integration</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Instant lead follow-ups. Sales reps focus on closing, not counting. Seamless workflow integration.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">Accuracy Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Dashboard shows detection accuracy, quote performance, and helps optimize your moving estimates over time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800">
              <div className="w-12 h-12 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent dark:text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary dark:text-white mb-3">See the Move. Quote Instantly.</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Professional experience for customers. Accurate quotes in seconds - not hours. Smarter workflow for your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              How it works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple, fast, and accurate-three steps to your moving quote
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[{
              step: '01',
              title: 'Upload Photos',
              desc: 'Drag-and-drop property photos or connect your listing. We handle the rest.'
            },{
              step: '02',
              title: 'AI Detects Inventory',
              desc: 'Furniture and specialty items are detected, sized, and grouped by room.'
            },{
              step: '03',
              title: 'Get Your Quote',
              desc: 'Receive a professional quote with crew size, time estimate, and pricing.'
            }].map((s) => (
              <div key={s.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Join moving companies already using AI to generate accurate quotes faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Try MovSense Free
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            <Link 
              to="/pricing" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-base transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MS</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">MovSense</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                AI-powered moving estimates that save time and increase accuracy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Pricing</Link></li>
                <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Get Started</Link></li>
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Help Center</button></li>
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Contact Us</button></li>
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Documentation</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">About</button></li>
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy</button></li>
                <li><button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2024 MovSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

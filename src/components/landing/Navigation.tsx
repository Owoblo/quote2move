import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MovSenseLogo from '../MovSenseLogo';
import ThemeToggle from '../ThemeToggle';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container-max">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <MovSenseLogo size="lg" />
          </Link>

          {/* Right: Links */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#product" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-primary dark:hover:text-blue-400 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-primary dark:hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-primary dark:hover:text-blue-400 transition-colors">FAQ</a>
            </div>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login" className="btn btn-ghost text-sm font-medium">
                Log in
              </Link>
              <Link 
                to="/login" 
                className="btn btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Mobile menu button (simplified) */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <Link 
              to="/login" 
              className="btn btn-primary text-xs px-4 py-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import MovSenseLogo from '../MovSenseLogo';
import ThemeToggle from '../ThemeToggle';

export default function Navigation() {
  return (
    <nav className="bg-background/95 dark:bg-primary/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center">
            <MovSenseLogo size="md" />
          </Link>

          {/* Right: Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#product" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              FAQ
            </a>
            <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              Login
            </Link>
            <ThemeToggle />
            <Link 
              to="/login" 
              className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow"
            >
              Get early access
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium text-sm">
              Login
            </Link>
            <Link 
              to="/login" 
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
            >
              Get early access
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


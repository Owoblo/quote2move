import React from 'react';
import { Link } from 'react-router-dom';
import MovSenseLogo from '../MovSenseLogo';
import ThemeToggle from '../ThemeToggle';

export default function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800 sticky top-0 z-50">
      <div className="container-max px-6 lg:px-10">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3">
            <MovSenseLogo size="lg" />
          </Link>

          {/* Right: Links */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-sm font-medium text-[#374151] dark:text-gray-300">
              <a href="#product" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link 
                to="/login" 
                className="btn btn-primary"
              >
                Get early access
              </Link>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/login" className="btn btn-secondary px-4 py-2 text-sm">
              Login
            </Link>
            <Link 
              to="/login" 
              className="btn btn-primary px-4 py-2 text-sm"
            >
              Get early access
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


import React from 'react';
import { Link } from 'react-router-dom';
import MovSenseLogo from '../MovSenseLogo';
import ThemeToggle from '../ThemeToggle';

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
      <div className="container-max px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center">
            <MovSenseLogo size="md" />
          </Link>

          {/* Right: Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#product" className="text-[#374151] hover:text-[#2563EB] font-medium text-sm transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="text-[#374151] hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-[#374151] hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-[#374151] hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              FAQ
            </a>
            <Link to="/login" className="text-[#374151] hover:text-primary dark:hover:text-white font-medium text-sm transition-colors">
              Login
            </Link>
            <ThemeToggle />
            <Link 
              to="/login" 
              className="btn btn-primary"
            >
              Get early access
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/login" className="text-[#374151] hover:text-primary dark:hover:text-white font-medium text-sm">
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


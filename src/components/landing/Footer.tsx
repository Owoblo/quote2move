import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Left: Logo and description */}
          <div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                MovSense
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              AI powered quoting for moving companies.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  About
                </button>
              </li>
              <li>
                <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Terms
                </button>
              </li>
              <li>
                <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Privacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} MovSense. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


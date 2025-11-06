import React from 'react';
import MovSenseLogo from '../MovSenseLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#F3F4F6] border-t border-[#E5E7EB] py-16">
      <div className="container-max mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Left: Logo and description */}
          <div>
            <div className="mb-4">
              <MovSenseLogo size="md" />
            </div>
            <p className="text-[#374151] text-sm">
              AI powered quoting for moving companies.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-[#111827] mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-[#374151]">
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
            <h4 className="font-semibold text-[#111827] mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-[#374151]">
              <li>
                <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  About
                </button>
              </li>
              <li>
                <a 
                  href="mailto:support@movsense.com" 
                  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@movsense.com" 
                  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  support@movsense.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[#111827] mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-[#374151]">
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
          <p className="text-sm text-[#374151]">
            © {currentYear} MovSense. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


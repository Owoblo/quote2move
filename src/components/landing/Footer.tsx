import React from 'react';
import MovSenseLogo from '../MovSenseLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-16">
      <div className="container-max mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Left: Logo and description */}
          <div>
            <div className="mb-4">
              <MovSenseLogo size="md" />
            </div>
            <p className="text-text-secondary text-sm">
              AI powered quoting for moving companies.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-text-primary mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-text-primary mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>
                <button type="button" className="hover:text-primary transition-colors text-left">
                  About
                </button>
              </li>
              <li>
                <a 
                  href="mailto:support@movsense.com" 
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@movsense.com" 
                  className="hover:text-primary transition-colors"
                >
                  support@movsense.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>
                <button type="button" className="hover:text-primary transition-colors text-left">
                  Terms
                </button>
              </li>
              <li>
                <button type="button" className="hover:text-primary transition-colors text-left">
                  Privacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-text-muted">
            © {currentYear} MovSense. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

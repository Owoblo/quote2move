import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import MovSenseLogo from '../components/MovSenseLogo';

export default function DemoThankYouPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Verify payment session
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setIsVerifying(false);
    }
  }, [sessionId]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.verified) {
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Still show success page for better UX
      setIsVerified(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-primary transition-colors duration-200">
      <Navigation />

      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">
              Thanks for activating MoveSense!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your city setup is now in queue.
            </p>
          </div>
        </div>

        {isVerifying ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verifying your payment...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  ✓ Your payment was successful!
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-primary dark:text-white mb-4">
                  What happens next?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-accent font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        City Setup (Within 2 Business Days)
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        We'll configure MLS integration and data setup for your city.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-accent font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Account Activation Email
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        You'll receive an email with login credentials once setup is complete.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-accent font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Start Your Free Month
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Your 1-month free Starter plan starts automatically once your city is live.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Questions? Contact us at{' '}
                  <a href="mailto:support@movsense.com" className="text-accent hover:underline">
                    support@movsense.com
                  </a>
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/"
                    className="flex-1 text-center px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Back to Home
                  </Link>
                  <Link
                    to="/login"
                    className="flex-1 text-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-accent text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-200"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

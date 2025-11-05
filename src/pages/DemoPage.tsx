import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import { loadStripe } from '@stripe/stripe-js';
import MovSenseLogo from '../components/MovSenseLogo';
import { supabase } from '../lib/supabase';

// Active regions that have full demo functionality
const ACTIVE_REGIONS = [
  'Windsor',
  'Tecumseh',
  'LaSalle',
  'Kitchener',
  'Toronto',
  'GTA',
  'Amherstburg',
];

interface Listing {
  id: string;
  address: string;
  addresscity: string;
  addressstate: string;
  carousel_photos_composable?: string;
  [key: string]: any;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

export default function DemoPage() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isActiveRegion, setIsActiveRegion] = useState<boolean | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Search database for listings as user types
  useEffect(() => {
    const searchListings = async () => {
      if (address.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsActiveRegion(null);
        setShowDemo(false);
        return;
      }

      setIsSearching(true);

      try {
        // Search both current and sold listings
        const [currentListings, soldListings] = await Promise.all([
          supabase
            .from('just_listed')
            .select('*')
            .or(`address.ilike.%${address}%, addresscity.ilike.%${address}%, addressstate.ilike.%${address}%`)
            .limit(10),
          supabase
            .from('sold_listings')
            .select('*')
            .or(`address.ilike.%${address}%, addresscity.ilike.%${address}%, addressstate.ilike.%${address}%`)
            .limit(10)
        ]);

        const allSuggestions = [
          ...(currentListings.data || []),
          ...(soldListings.data || [])
        ];

        setSuggestions(allSuggestions);
        setShowSuggestions(true);

        // Check if any suggestion is in an active region
        const addressLower = address.toLowerCase();
        const isActive = ACTIVE_REGIONS.some(region => 
          addressLower.includes(region.toLowerCase())
        ) || allSuggestions.some(listing => {
          const listingAddress = `${listing.addresscity} ${listing.addressstate}`.toLowerCase();
          return ACTIVE_REGIONS.some(region => listingAddress.includes(region.toLowerCase()));
        });

        setIsActiveRegion(isActive);
        if (!isActive) {
          setShowDemo(false);
        }
      } catch (error) {
        console.error('Error searching listings:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchListings, 300);
    return () => clearTimeout(timeoutId);
  }, [address]);

  // Enable demo for active regions even if address not in database
  useEffect(() => {
    if (isActiveRegion === true && address.length > 10 && !selectedListing) {
      // Check if address contains an active region
      const addressLower = address.toLowerCase();
      const cityMatch = ACTIVE_REGIONS.find(region => 
        addressLower.includes(region.toLowerCase())
      );
      
      if (cityMatch) {
        // Create a mock listing to allow demo to proceed
        const mockListing: Listing = {
          id: 'manual-entry',
          address: address.split(',')[0]?.trim() || address,
          addresscity: cityMatch,
          addressstate: address.includes('ON') ? 'ON' : 'ON',
        };
        setSelectedListing(mockListing);
        setShowDemo(true);
      }
    } else if (!isActiveRegion || address.length <= 10) {
      if (selectedListing?.id === 'manual-entry') {
        setSelectedListing(null);
        setShowDemo(false);
      }
    }
  }, [isActiveRegion, address, selectedListing]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (!suggestions.find(s => `${s.address}, ${s.addresscity}, ${s.addressstate}` === newAddress)) {
      setSelectedListing(null);
      setShowDemo(false);
    }
  };

  const handleSuggestionClick = (listing: Listing) => {
    const fullAddress = `${listing.address}, ${listing.addresscity}, ${listing.addressstate}`;
    setAddress(fullAddress);
    setSelectedListing(listing);
    setShowSuggestions(false);

    // Check if this listing is in an active region
    const listingLocation = `${listing.addresscity} ${listing.addressstate}`.toLowerCase();
    const isActive = ACTIVE_REGIONS.some(region => 
      listingLocation.includes(region.toLowerCase())
    );

    setIsActiveRegion(isActive);
    
    if (isActive) {
      setShowDemo(true);
    } else {
      setShowDemo(false);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleActivateAccount = async () => {
    setIsProcessingPayment(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.REACT_APP_STRIPE_ACTIVATION_PRICE_ID || 'price_activation_fee',
          mode: 'payment',
          successUrl: `${window.location.origin}/demo/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/demo`,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        // Type assertion needed - redirectToCheckout exists at runtime
        const { error: redirectError } = await (stripe as any).redirectToCheckout({
          sessionId,
        });

        if (redirectError) {
          throw redirectError;
        }
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(`Failed to process payment: ${error.message}`);
      setIsProcessingPayment(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;

    try {
      // Save to Supabase or send to backend
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: leadEmail,
          source: 'demo_page_waitlist',
        }),
      });

      if (response.ok) {
        setLeadSubmitted(true);
        setLeadEmail('');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      // Still show success for better UX
      setLeadSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-primary transition-colors duration-200">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-white mb-4 tracking-tight">
              Get Instant Moving Quotes from Just a Property Address.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Type any address in the activated cities below and watch MoveSense pull furniture and room data automatically from MLS photos.
            </p>
          </div>

          {/* Search Demo Box */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter property address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="e.g., 125 Links Dr, Amherstburg, ON"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((listing) => {
                      const fullAddress = `${listing.address}, ${listing.addresscity}, ${listing.addressstate}`;
                      return (
                        <button
                          key={listing.id}
                          type="button"
                          onClick={() => handleSuggestionClick(listing)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {listing.address}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {listing.addresscity}, {listing.addressstate}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results message */}
                {showSuggestions && suggestions.length === 0 && address.length >= 2 && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No properties found. Try a different address.
                    </p>
                  </div>
                )}
              </div>

              {/* Active Regions List */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currently active regions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVE_REGIONS.map((region) => (
                    <span
                      key={region}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              {/* Region Status Message */}
              {isActiveRegion === false && address.length > 3 && selectedListing && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    This region isn't live yet. You can still get early access — activate your company's city below.
                  </p>
                </div>
              )}

              {isActiveRegion === true && selectedListing && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ This region is active! Demo results will show below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Demo Results */}
          {showDemo && isActiveRegion && (selectedListing || address.length > 10) && (
            <div className="max-w-6xl mx-auto mt-8">
              <InteractiveDemo 
                initialAddress={selectedListing ? `${selectedListing.address}, ${selectedListing.addresscity}, ${selectedListing.addressstate}` : address}
                hideSearch={true}
              />
            </div>
          )}
        </div>
      </section>

      {/* Activation CTA Section */}
      {(isActiveRegion === false || isActiveRegion === null) && (
        <section className="py-16 px-6 bg-gradient-to-br from-accent/5 to-highlight/5 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">
              Activate MoveSense in Your City
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              We're currently onboarding new moving companies city-by-city. Activate your account and get full access within 2 business days.
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary dark:text-white">$249</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">One-time setup fee</p>
              </div>

              <div className="text-left max-w-md mx-auto mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Includes your city data setup, MLS integration, and 1-month free starter plan.
                </p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    City data setup and configuration
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    MLS integration for your area
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    1-month free Starter plan ($49/month after)
                  </li>
                </ul>
              </div>

              <button
                onClick={handleActivateAccount}
                disabled={isProcessingPayment}
                className="w-full md:w-auto px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? 'Processing...' : 'Activate My Account'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Video Demo Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">
            Watch how it works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            See MoveSense in action (2-min video)
          </p>
          
          {/* Video Embed - Replace with actual Loom/YouTube embed */}
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <iframe
              className="w-full h-full"
              src="https://www.loom.com/embed/your-video-id-here"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="MoveSense Demo Video"
            ></iframe>
            {/* Fallback if no video ID */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">Video embed - Add your Loom or YouTube video ID</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            See how we turn listing photos into precise moving quotes in seconds. No walkthroughs, no spreadsheets, no guesswork.
          </p>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-white mb-4">
            Your city not listed yet?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get notified when MoveSense activates in your area.
          </p>

          {!leadSubmitted ? (
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                ✓ Thanks! We'll notify you when MoveSense is available in your area.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

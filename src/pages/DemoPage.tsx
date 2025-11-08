import React, { useState } from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import SearchPanel from '../components/SearchPanel';

// Active regions that have full demo functionality
const ACTIVE_REGIONS = [
  'Windsor',
  'Tecumseh',
  'LaSalle',
  'Kitchener',
  'Toronto',
  'GTA',
  'Amherstburg',
  'Milwaukee'
];

interface Listing {
  id: string;
  address: string;
  addresscity: string;
  addressstate: string;
  carousel_photos_composable?: string;
  [key: string]: any;
}

export default function DemoPage() {
  const [address, setAddress] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isActiveRegion, setIsActiveRegion] = useState<boolean | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [triggerFetch, setTriggerFetch] = useState(false);

  // Check if listing is in active region
  const checkActiveRegion = (listing: Listing | null) => {
    if (!listing) {
      setIsActiveRegion(null);
      return false;
    }
    
    const location = `${listing.addresscity} ${listing.addressstate}`.toLowerCase();
    const isActive = ACTIVE_REGIONS.some(region => 
      location.includes(region.toLowerCase())
    );
    
    setIsActiveRegion(isActive);
    return isActive;
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (!selectedListing) {
      setIsActiveRegion(null);
    }
  };

  const handleListingSelect = (listing: any) => {
    // Map SearchPanel listing format to DemoPage listing format
    const mappedListing: Listing = {
      id: listing.id,
      address: listing.address,
      addresscity: listing.addresscity || listing.city,
      addressstate: listing.addressstate || listing.state,
      carousel_photos_composable: listing.carousel_photos_composable,
      ...listing
    };
    setSelectedListing(mappedListing);
    checkActiveRegion(mappedListing);
  };

  const handleClear = () => {
    setAddress('');
    setSelectedListing(null);
    setIsActiveRegion(null);
  };

  const handleFetchPhotos = async () => {
    // When "Load Photos & Auto-Detect" is clicked, trigger photo fetch
    if (!selectedListing) {
      alert('Please select a property from the dropdown first');
      return;
    }
    
    // Trigger fetch by toggling the trigger state
    setTriggerFetch(prev => !prev);
  };

  const handleActivateAccount = () => {
    window.location.href = 'https://buy.stripe.com/3cI5kw04pfsI2BD3Vp1Nu00';
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
    <div className="min-h-screen bg-[#F3F4F6] transition-colors duration-200">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-white mb-4 tracking-tight">
              Get Instant Moving Quotes from Just a Property Address.
            </h1>
            <p className="text-xl text-[#374151] max-w-3xl mx-auto mb-8">
              Type any address in the activated cities below and watch MoveSense pull furniture and room data automatically from MLS photos.
            </p>
          </div>

          {/* Search Demo Box - Using SearchPanel component */}
          <div className="max-w-4xl mx-auto mb-8">
            <SearchPanel
              address={address}
              onAddressChange={handleAddressChange}
              onFetchPhotos={handleFetchPhotos}
              onClear={handleClear}
              recentSearches={[]}
              onListingSelect={handleListingSelect}
            />
            
            {/* Active Regions List */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-6">
              <p className="text-sm font-medium text-[#374151] mb-3">
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
            {isActiveRegion === false && selectedListing && (
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

          {/* Demo Results - Show when listing is selected */}
          {selectedListing && (
            <div className="max-w-4xl mx-auto mt-8">
              <InteractiveDemo 
                initialAddress={`${selectedListing.address}, ${selectedListing.addresscity}, ${selectedListing.addressstate}`}
                hideSearch={true}
                triggerFetch={triggerFetch}
                selectedListingData={selectedListing}
              />
            </div>
          )}
        </div>
      </section>

      {/* Activation CTA Section - Show for all users, with different messaging for active vs inactive regions */}
      {(isActiveRegion === false || isActiveRegion === null || isActiveRegion === true) && (
        <section className="py-16 px-6 bg-gradient-to-br from-accent/5 to-highlight/5 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">                                                                   
              {isActiveRegion === true ? 'Get Full Access to MoveSense' : 'Activate MoveSense in Your City'}
            </h2>
            <p className="text-lg text-[#374151] mb-8 max-w-2xl mx-auto">
              {isActiveRegion === true 
                ? "Ready to start using MoveSense? Activate your account and get full access with 1-month free starter plan."
                : "We're currently onboarding new moving companies city-by-city. Activate your account and get full access within 2 business days."}
            </p>

            <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 mb-8">
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary dark:text-white">$249</span>
                <p className="text-[#374151] mt-2">One-time setup fee</p>
              </div>

              <div className="text-left max-w-md mx-auto mb-8">
                <p className="text-sm text-[#374151] mb-4">
                  Includes your city data setup, MLS integration, and 1-month free starter plan.
                </p>
                <ul className="space-y-2 text-sm text-[#374151]">
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
                className="w-full md:w-auto px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Activate My Account
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
          <p className="text-lg text-[#374151] mb-8">
            See MoveSense in action (2-min video)
          </p>
          
          {/* Video Embed */}
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <iframe
              className="w-full h-full"
              src="https://www.loom.com/embed/1547a2753f084ffdba028531c1db49b2"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="MoveSense Demo Video"
            ></iframe>
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
          <p className="text-[#374151] mb-6">
            Get notified when MoveSense activates in your area.
          </p>

          {!leadSubmitted ? (
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
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
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
              <p className="text-green-800 dark:text-green-200">
                ✓ Thanks! We'll notify you when MoveSense is available in your area.
              </p>
            </div>
          )}
          
          <p className="text-sm text-[#374151]">
            Questions? Email us at{' '}
            <a 
              href="mailto:support@movsense.com" 
              className="text-accent hover:text-accent-dark font-medium underline"
            >
              support@movsense.com
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

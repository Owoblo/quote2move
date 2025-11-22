import React, { useState, useEffect, useRef } from 'react';
import { supabaseSold2Move } from '../lib/supabase';

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  listing_date?: string;
  status?: string;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  [key: string]: any;
}

interface SearchPanelProps {
  address: string;
  onAddressChange: (address: string) => void;
  onFetchPhotos: () => void;
  onClear: () => void;
  recentSearches: string[];
  onListingSelect?: (listing: Listing) => void;
  onPhotoUpload?: (files: FileList) => void;
}

export default function SearchPanel({
  address,
  onAddressChange,
  onFetchPhotos,
  onClear,
  recentSearches,
  onListingSelect,
  onPhotoUpload
}: SearchPanelProps) {
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const justSelectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Search for listings as user types
  useEffect(() => {
    const searchListings = async () => {
      // Skip search if user just selected a suggestion
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }

      if (address.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('Searching for:', address);

      try {
        // Search both current and sold listings
        // Extract search terms from address - use first few words for better matching
        const addressParts = address.split(',').map(s => s.trim());
        const searchTerm = addressParts[0] || address; // Use first part (street address) or full address

        const [currentListings, soldListings] = await Promise.all([
          supabaseSold2Move
            .from('just_listed')
            .select('*')
            .ilike('address', `%${searchTerm}%`)
            .limit(5),
          supabaseSold2Move
            .from('sold_listings')
            .select('*')
            .ilike('address', `%${searchTerm}%`)
            .limit(5)
        ]);

        console.log('Current listings:', currentListings);
        console.log('Sold listings:', soldListings);

        const allSuggestions = [
          ...(currentListings.data || []),
          ...(soldListings.data || [])
        ].map(listing => {
          // Parse hdpdata to extract lot area information
          if (listing.hdpdata && typeof listing.hdpdata === 'object') {
            try {
              const homeInfo = listing.hdpdata.homeInfo || {};
              return {
                ...listing,
                lotAreaValue: homeInfo.lotAreaValue,
                lotAreaUnit: homeInfo.lotAreaUnit
              };
            } catch (error) {
              console.error('Error parsing hdpdata for listing:', listing.id, error);
              return listing;
            }
          }
          return listing;
        });

        console.log('All suggestions:', allSuggestions);
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);

        if (allSuggestions.length === 0) {
          setError('No properties found. Try a different address.');
        }
      } catch (error) {
        console.error('Error searching listings:', error);
        setSuggestions([]);
        setError('Failed to search properties. Please try again.');
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchListings, 200); // Reduced debounce for faster response
    return () => clearTimeout(timeoutId);
  }, [address]);

  const handleSuggestionClick = (listing: Listing) => {
    // Clear any pending blur timeout immediately
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // Mark that we just selected a suggestion (prevents search from running)
    justSelectedRef.current = true;

    // Close dropdown immediately - clear suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);

    // Fill the input with the complete address
    const fullAddress = `${listing.address}, ${listing.addresscity}, ${listing.addressstate}`;
    onAddressChange(fullAddress);

    // Store the selected listing for photo fetching
    if (onListingSelect) {
      onListingSelect(listing);
    }

    // Blur the input to remove focus
    const input = document.getElementById('address') as HTMLInputElement;
    if (input) {
      input.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddressChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
      // Reset dropdown display if it was hidden
      if (dropdownRef.current) {
        dropdownRef.current.style.display = '';
        dropdownRef.current.style.pointerEvents = 'auto';
      }
    } else if (address.length > 0) {
      // Trigger search if there's text but no suggestions yet
      setShowSuggestions(true);
      if (dropdownRef.current) {
        dropdownRef.current.style.display = '';
        dropdownRef.current.style.pointerEvents = 'auto';
      }
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check what element is receiving focus
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // If clicking on a suggestion item, don't close (click handler will handle it)
    if (relatedTarget && relatedTarget.closest('.suggestion-item')) {
      return;
    }
    
    // If clicking on a button, close immediately
    if (relatedTarget && relatedTarget.closest('button')) {
      setShowSuggestions(false);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      return;
    }
    
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    // Small delay to allow button clicks to register
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      blurTimeoutRef.current = null;
    }, 150);
  };

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-[#111827] mb-1.5">Property Search</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Enter an address to automatically detect furniture and generate moving estimates</p>
      </div>
      
      {/* Address Input with Autocomplete */}
      <div className="mb-6 relative z-10">
        <label htmlFor="address" className="block text-sm font-medium text-[#374151] mb-3">
          Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            id="address"
            type="text"
            value={address}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search for any address..."
            className="input pl-11"
          />
          {loading && (
            <div className="absolute right-4 top-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && !loading && (
          <div className="absolute z-30 w-full mt-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md shadow-lg px-4 py-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && !loading && (
          <div
            ref={dropdownRef}
            className="absolute z-30 w-full mt-1.5 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-md shadow-premium-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((listing, index) => (
              <div
                key={`${listing.id}-${index}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionClick(listing);
                }}
                className="suggestion-item px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150"
              >
                <div className="font-medium text-[#111827] dark:text-gray-100 text-sm">
                  {listing.address}
                </div>
                <div className="text-xs text-[#374151] dark:text-gray-300 mt-1">
                  {listing.addresscity}, {listing.addressstate}
                  {listing.unformattedprice && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                      ${listing.unformattedprice.toLocaleString()}
                    </span>
                  )}
                </div>
                {(listing.beds || listing.baths || listing.lotAreaValue) && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {listing.beds && `${listing.beds} bed`}
                    {listing.beds && listing.baths && ' • '}
                    {listing.baths && `${listing.baths} bath`}
                    {(listing.beds || listing.baths) && listing.lotAreaValue && ' • '}
                    {listing.lotAreaValue && `${listing.lotAreaValue.toLocaleString()} ${listing.lotAreaUnit || 'sqft'}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onFetchPhotos}
          disabled={!address || loading}
          className="btn btn-primary flex-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Load Photos & Auto-Detect</span>
        </button>
        <button
          onClick={onClear}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

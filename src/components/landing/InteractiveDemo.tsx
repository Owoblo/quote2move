import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { parseZillowPhotos } from '../../lib/zillowPhotos';
import { detectFurniture } from '../../lib/aiDetectionServices';
import { Photo, Detection } from '../../types';

interface Listing {
  id: string;
  address: string;
  addresscity: string;
  addressstate: string;
  carousel_photos_composable?: string;
  [key: string]: any;
}

const MAX_DEMO_SEARCHES = 2;
const DEFAULT_ADDRESS = '125 Links Dr, Amherstburg, ON';

export default function InteractiveDemo() {
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select default address if it matches a listing
  useEffect(() => {
    const autoSelectDefault = async () => {
      if (address === DEFAULT_ADDRESS && !selectedListing) {
        try {
          const [currentResult, soldResult] = await Promise.all([
            supabase
              .from('just_listed')
              .select('*')
              .ilike('address', `%125 Links Dr%`)
              .limit(1),
            supabase
              .from('sold_listings')
              .select('*')
              .ilike('address', `%125 Links Dr%`)
              .limit(1)
          ]);

          const allListings = [
            ...(currentResult.data || []),
            ...(soldResult.data || [])
          ];

          if (allListings.length > 0) {
            setSelectedListing(allListings[0]);
          }
        } catch (error) {
          console.error('Error auto-selecting default:', error);
        }
      }
    };
    autoSelectDefault();
  }, []);

  // Search for listings as user types
  useEffect(() => {
    const searchListings = async () => {
      if (address.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const [currentListings, soldListings] = await Promise.all([
          supabase
            .from('just_listed')
            .select('*')
            .or(`address.ilike.%${address}%, addresscity.ilike.%${address}%, addressstate.ilike.%${address}%`)
            .limit(5),
          supabase
            .from('sold_listings')
            .select('*')
            .or(`address.ilike.%${address}%, addresscity.ilike.%${address}%, addressstate.ilike.%${address}%`)
            .limit(5)
        ]);

        const allSuggestions = [
          ...(currentListings.data || []),
          ...(soldListings.data || [])
        ];

        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching listings:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(searchListings, 300);
    return () => clearTimeout(timeoutId);
  }, [address]);

  const handleSuggestionClick = (listing: Listing) => {
    const fullAddress = `${listing.address}, ${listing.addresscity}, ${listing.addressstate}`;
    setAddress(fullAddress);
    setSelectedListing(listing);
    setShowSuggestions(false);
  };

  const fetchPhotos = async () => {
    if (searchCount >= MAX_DEMO_SEARCHES) {
      setShowSignupPrompt(true);
      return;
    }

    if (!selectedListing) {
      setError('Please select an address from the suggestions');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPhotos([]);
    setDetections([]);

    try {
      let photoUrls: string[] = [];
      let listingWithPhotos = selectedListing;

      // Check if selected listing has carousel_photos_composable
      if (selectedListing.carousel_photos_composable) {
        photoUrls = parseZillowPhotos(selectedListing.carousel_photos_composable);
      } else {
        // Try to fetch from database with optimized search
        const addressParts = selectedListing.address.split(' ');
        const houseNumber = addressParts[0];
        const streetName = addressParts.slice(1, 3).join(' ');

        const searchTerms = [
          `${houseNumber} ${streetName}`,
          selectedListing.address.split(',')[0],
          houseNumber,
          streetName
        ];

        // Search both tables
        for (const term of searchTerms) {
          const [currentResult, soldResult] = await Promise.all([
            supabase
              .from('just_listed')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .ilike('address', `%${term}%`)
              .limit(3),
            supabase
              .from('sold_listings')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .ilike('address', `%${term}%`)
              .limit(3)
          ]);

          const allListings = [
            ...(currentResult.data || []),
            ...(soldResult.data || [])
          ];

          // Find listing with photos
          const listingWithCarousel = allListings.find(
            (listing: any) => listing.carousel_photos_composable
          );

          if (listingWithCarousel?.carousel_photos_composable) {
            listingWithPhotos = listingWithCarousel;
            photoUrls = parseZillowPhotos(listingWithCarousel.carousel_photos_composable);
            break;
          }
        }
      }

      if (photoUrls.length > 0) {
        const formattedPhotos: Photo[] = photoUrls.slice(0, 6).map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          thumbnailUrl: url,
          filename: `property-photo-${index + 1}.jpg`,
          uploadedAt: new Date()
        }));

        setPhotos(formattedPhotos);
        setSearchCount(prev => prev + 1);

        // Automatically start detection
        await runDetection(formattedPhotos);
      } else {
        setError('No photos found for this address. Try searching for another property!');
      }
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      setError('Error fetching photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const runDetection = async (photosToDetect: Photo[]) => {
    setIsDetecting(true);
    setDetections([]);

    try {
      const photoUrls = photosToDetect.map(p => p.url);
      const detectedItems = await detectFurniture(photoUrls);

      // Group by room
      const roomGroups: { [key: string]: Detection[] } = {};
      detectedItems.forEach(item => {
        const room = item.room || 'Other';
        if (!roomGroups[room]) {
          roomGroups[room] = [];
        }
        roomGroups[room].push(item);
      });

      setDetections(detectedItems);
    } catch (error: any) {
      console.error('Detection error:', error);
      setError('AI detection failed. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Calculate estimated hours and cost
  const estimatedHours = detections.length > 0 ? Math.max(2, Math.ceil(detections.length / 10) * 0.5) : 0;
  const estimatedCost = Math.round(estimatedHours * 150);

  // Group detections by room for display
  const roomGroups: { [key: string]: Detection[] } = {};
  detections.forEach(item => {
    const room = item.room || 'Other';
    if (!roomGroups[room]) {
      roomGroups[room] = [];
    }
    roomGroups[room].push(item);
  });

  return (
    <div className="relative">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
        {/* Top: Address search field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Property Address
          </label>
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setShowSuggestions(true);
                  setSelectedListing(null);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding to allow clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Enter property address..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                disabled={isLoading || isDetecting || showSignupPrompt}
              />
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
              )}
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && !selectedListing && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((listing, index) => (
                  <div
                    key={`${listing.id}-${index}`}
                    onClick={() => handleSuggestionClick(listing)}
                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {listing.address}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {listing.addresscity}, {listing.addressstate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          {!showSignupPrompt && (
            <button
              onClick={fetchPhotos}
              disabled={!selectedListing || isLoading || isDetecting}
              className="mt-3 w-full bg-accent hover:bg-accent-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isDetecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>AI Detecting...</span>
                </>
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Loading Photos...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Analyze Property</span>
                </>
              )}
            </button>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Signup prompt */}
          {showSignupPrompt && (
            <div className="mt-3 p-4 bg-accent/10 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                You've used {MAX_DEMO_SEARCHES} free searches! Sign up to get unlimited access.
              </p>
              <Link
                to="/login"
                className="block w-full text-center bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Sign Up for Free
              </Link>
            </div>
          )}
        </div>

        {/* Middle: Photo preview grid */}
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo.url}
                    alt="Property"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: Auto detected inventory and quote */}
        {(detections.length > 0 || isDetecting) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto detected inventory */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Auto detected inventory
              </h3>
              {isDetecting ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                    <span>AI analyzing photos...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {Object.entries(roomGroups).map(([room, items]) => {
                    const itemCounts: { [key: string]: number } = {};
                    items.forEach(item => {
                      itemCounts[item.label] = (itemCounts[item.label] || 0) + (item.qty || 1);
                    });
                    const itemList = Object.entries(itemCounts)
                      .map(([label, count]) => `${count} ${label}`)
                      .join(', ');
                    return (
                      <div key={room} className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{room}:</span> {itemList}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quote estimate */}
            <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Quote estimate
              </h3>
              {isDetecting ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Analyzing...</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">-</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Estimated hours:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{estimatedHours.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Estimated cost:</span>
                    <span className="font-semibold text-accent dark:text-accent-light">${estimatedCost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items detected:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{detections.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && !isLoading && !error && !showSignupPrompt && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter an address above to see AI detection in action
            </p>
          </div>
        )}
      </div>

      {/* Search counter */}
      {searchCount > 0 && !showSignupPrompt && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {searchCount} of {MAX_DEMO_SEARCHES} free searches used • <Link to="/login" className="text-accent dark:text-accent-light hover:underline">Sign up</Link> for unlimited
          </p>
        </div>
      )}
    </div>
  );
}


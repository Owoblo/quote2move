import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const MAX_DEMO_SEARCHES = 3;
const DEFAULT_ADDRESS = '125 Links Dr, Amherstburg, ON';
const CACHE_KEY = 'movsense_demo_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  photos: Photo[];
  detections: Detection[];
  timestamp: number;
  address: string;
}

interface InteractiveDemoProps {
  initialAddress?: string;
  hideSearch?: boolean; // Hide the search input when controlled externally (e.g., from DemoPage)
  triggerFetch?: boolean; // Trigger photo fetching when this changes
  selectedListingData?: any; // Pass the selected listing data directly
}

export default function InteractiveDemo({ initialAddress, hideSearch = false, triggerFetch = false, selectedListingData }: InteractiveDemoProps = {}) {
  const [address, setAddress] = useState(initialAddress || DEFAULT_ADDRESS);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(selectedListingData || null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const searchCountRef = useRef(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [displayAddress, setDisplayAddress] = useState('');

  useEffect(() => {
    searchCountRef.current = searchCount;
  }, [searchCount]);

  // Update address when initialAddress prop changes
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
      setIsDefaultAddress(initialAddress === DEFAULT_ADDRESS);
    }
  }, [initialAddress, address]);

  // Update selectedListing when selectedListingData prop changes
  useEffect(() => {
    if (selectedListingData) {
      setSelectedListing(selectedListingData);
    }
  }, [selectedListingData]);

  // Trigger photo fetch when triggerFetch prop changes
  // Load cached data for default address
  const loadCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        // Check if cache is valid and for default address
        if (data.address === DEFAULT_ADDRESS && Date.now() - data.timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
    return null;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((photos: Photo[], detections: Detection[], address: string) => {
    try {
      const cacheData: CachedData = {
        photos,
        detections,
        timestamp: Date.now(),
        address
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }, []);

  // Typing animation for default address with blinking cursor
  useEffect(() => {
    if (address === DEFAULT_ADDRESS && photos.length === 0 && !isTyping) {
      setIsTyping(true);
      setDisplayAddress('');
      const fullText = DEFAULT_ADDRESS;
      let currentIndex = 0;
      let showCursor = true;
      
      // Blinking cursor animation
      const cursorInterval = setInterval(() => {
        showCursor = !showCursor;
      }, 530); // Blink speed
      
      const typeInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          const cursor = showCursor ? '|' : '';
          setDisplayAddress(fullText.slice(0, currentIndex + 1) + cursor);
          currentIndex++;
        } else {
          // Keep cursor at end when done
          setDisplayAddress(fullText + '|');
          clearInterval(typeInterval);
          // Remove cursor after a moment
          setTimeout(() => {
            clearInterval(cursorInterval);
            setDisplayAddress(fullText);
            setIsTyping(false);
          }, 500);
        }
      }, 50); // Type speed
      
      return () => {
        clearInterval(typeInterval);
        clearInterval(cursorInterval);
      };
    } else if (address !== DEFAULT_ADDRESS) {
      setDisplayAddress(address);
    }
  }, [address, photos.length, isTyping]);

  // Auto-start for default address
  useEffect(() => {
    const autoStartDefault = async () => {
      if (address === DEFAULT_ADDRESS && photos.length === 0 && !isTyping) {
        setIsDefaultAddress(true);
        
        // Wait for typing animation to complete
        await new Promise(resolve => setTimeout(resolve, DEFAULT_ADDRESS.length * 50 + 500));
        
        // Check cache first
        const cached = loadCachedData();
        if (cached) {
          // Show detecting animation briefly, then show cached results instantly
          setIsDetecting(true);
          await new Promise(resolve => setTimeout(resolve, 1800)); // Brief detection animation
          setPhotos(cached.photos);
          setDetections(cached.detections);
          setIsDetecting(false);
          return;
        }

        // If no cache, fetch and detect
        try {
          setIsDetecting(true);
          
          // Find listing
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
            const listing = allListings[0];
            setSelectedListing(listing);

            // Fetch photos
            let photoUrls: string[] = [];
            if (listing.carousel_photos_composable) {
              photoUrls = parseZillowPhotos(listing.carousel_photos_composable);
            }

            if (photoUrls.length > 0) {
              // Skip first 4 photos (exterior) and show ALL interior photos
              const interiorPhotos = photoUrls.slice(4); // Skip 4, show all remaining (could be 40+)
              
              const formattedPhotos: Photo[] = interiorPhotos.map((url, index) => ({
                id: `photo-${index}`,
                url: url,
                thumbnailUrl: url,
                filename: `property-photo-${index + 1}.jpg`,
                uploadedAt: new Date()
              }));

              // Show photos immediately (no loading)
              setPhotos(formattedPhotos);

              // Detect with ALL photos and store everything
              const detectedItems = await detectFurniture(interiorPhotos); // Detect ALL photos
              
              setDetections(detectedItems);
              setIsDetecting(false);

              // Cache ALL photos and ALL detections for instant future loads
              saveToCache(formattedPhotos, detectedItems, DEFAULT_ADDRESS);
            } else {
              setIsDetecting(false);
            }
          } else {
            setIsDetecting(false);
          }
        } catch (error) {
          console.error('Error auto-starting default:', error);
          setIsDetecting(false);
        }
      }
    };
    autoStartDefault();
  }, [address, photos.length, isTyping, loadCachedData, saveToCache]);

  // Search for listings as user types
  useEffect(() => {
    const searchListings = async () => {
      if (address.length < 3 || address === DEFAULT_ADDRESS) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsDefaultAddress(false);

      try {
        // Extract search terms from address for better query
        const addressParts = address.split(',').map(s => s.trim());
        const searchTerm = addressParts[0] || address;
        const cityTerm = addressParts[1] || '';
        const stateTerm = addressParts[2] || '';
        
        let query = `address.ilike.%${searchTerm}%`;
        if (cityTerm) {
          query += `,addresscity.ilike.%${cityTerm}%`;
        }
        if (stateTerm) {
          query += `,addressstate.ilike.%${stateTerm}%`;
        }
        
        const [currentListings, soldListings] = await Promise.all([
          supabase
            .from('just_listed')
            .select('*')
            .or(query)
            .limit(3), // Limited to 3 for demo
          supabase
            .from('sold_listings')
            .select('*')
            .or(query)
            .limit(3) // Limited to 3 for demo
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
    setIsDefaultAddress(false);
  };

  const fetchPhotos = useCallback(async () => {
    if (searchCountRef.current >= MAX_DEMO_SEARCHES) {
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

      // Check if selected listing has carousel_photos_composable
      if (selectedListing.carousel_photos_composable) {
        photoUrls = parseZillowPhotos(selectedListing.carousel_photos_composable);
      } else {
        // Try to fetch from database
        const addressParts = selectedListing.address.split(',').map(s => s.trim());
        const streetAddress = addressParts[0] || selectedListing.address;
        const city = addressParts[1] || selectedListing.addresscity || '';
        const state = addressParts[2] || selectedListing.addressstate || '';
        
        // Build cleaner search query
        let searchQuery = `address.ilike.%${streetAddress}%`;
        if (city) {
          searchQuery += `,addresscity.ilike.%${city}%`;
        }
        if (state) {
          searchQuery += `,addressstate.ilike.%${state}%`;
        }
        
        const [currentResult, soldResult] = await Promise.all([
          supabase
            .from('just_listed')
            .select('id, address, addresscity, addressstate, carousel_photos_composable')
            .or(searchQuery)
            .limit(3), // Limit to 3 for demo
          supabase
            .from('sold_listings')
            .select('id, address, addresscity, addressstate, carousel_photos_composable')
            .or(searchQuery)
            .limit(3) // Limit to 3 for demo
        ]);

        const allListings = [
          ...(currentResult.data || []),
          ...(soldResult.data || [])
        ];

        const listingWithCarousel = allListings.find(
          (listing: any) => listing.carousel_photos_composable
        );

        if (listingWithCarousel?.carousel_photos_composable) {
          photoUrls = parseZillowPhotos(listingWithCarousel.carousel_photos_composable);
        }
      }

      if (photoUrls.length > 0) {
        // For non-default addresses, show all photos
        // For default address, skip first 4 (exterior) and show all interior photos
        const photosToShow = isDefaultAddress ? photoUrls.slice(4) : photoUrls;
        
        const formattedPhotos: Photo[] = photosToShow.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          thumbnailUrl: url,
          filename: `property-photo-${index + 1}.jpg`,
          uploadedAt: new Date()
        }));

        // Show photos immediately
        setPhotos(formattedPhotos);
        setSearchCount(prev => {
          const next = prev + 1;
          searchCountRef.current = next;
          return next;
        });

        // Start detection with all photos
        setIsDetecting(true);
        const detectedItems = await detectFurniture(photosToShow); // Detect ALL photos
        setDetections(detectedItems);
        setIsDetecting(false);
      } else {
        setError('No photos found for this address. Try searching for another property!');
      }
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      setError('Error fetching photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedListing, isDefaultAddress]);

  useEffect(() => {
    if (triggerFetch && selectedListing && !isLoading && !isDetecting) {
      console.log('Triggering photo fetch from DemoPage button click', selectedListing);
      fetchPhotos();
    }
  }, [triggerFetch, selectedListing, isLoading, isDetecting, fetchPhotos]);

  // Demo quote estimate - hardcoded for demo purposes
  const estimatedHours = 8;
  const estimatedCost = 1950;

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
    <div id="demo" className="relative space-y-6">
      {!hideSearch && (
        <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">
            See it work right now
          </p>
          <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
            Type any property address. We'll pull MLS photos and show you what MovSense detects—live.
          </h3>
          <p className="text-sm text-[#374151] dark:text-gray-300">
            💡 Try: <button type="button" className="text-accent underline" onClick={() => setAddress('245 Carlaw Ave #403, Toronto, ON')}>245 Carlaw Ave #403, Toronto</button> or any listing with photos.
          </p>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-h-[600px] flex flex-col">
        {/* Top: Address search field - Hidden if hideSearch prop is true */}
        {!hideSearch && (
          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Property Address
            </label>
            <div className="relative">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-[#E5E7EB]">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  type="text"
                  value={isDefaultAddress && isTyping ? displayAddress : address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setDisplayAddress(e.target.value);
                    setShowSuggestions(true);
                    setSelectedListing(null);
                    setIsDefaultAddress(e.target.value === DEFAULT_ADDRESS);
                    setIsTyping(false);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Enter property address..."
                  className="flex-1 bg-transparent text-sm text-[#111827] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  disabled={isDetecting || showSignupPrompt}
                />
              </div>

              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && !selectedListing && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((listing, index) => (
                    <div
                      key={`${listing.id}-${index}`}
                      onClick={() => handleSuggestionClick(listing)}
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-[#111827]">
                        {listing.address}
                      </div>
                      <div className="text-xs text-[#374151]">
                        {listing.addresscity}, {listing.addressstate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action button and help text */}
            {!showSignupPrompt && (
              <div className="mt-3 space-y-2">
                {/* Help text for default address */}
                {isDefaultAddress && photos.length > 0 && (
                  <div className="p-2 bg-accent/5 dark:bg-accent/10 border border-accent/20 dark:border-accent/30 rounded-lg">
                    <p className="text-xs text-[#374151] mb-2">
                      💡 <span className="font-medium">Try searching any address!</span> See how MovSense works with any property.
                    </p>
                    <button
                      onClick={() => {
                        setAddress('');
                        setSelectedListing(null);
                        setPhotos([]);
                        setDetections([]);
                        setError(null);
                        setIsDefaultAddress(false);
                      }}
                      className="w-full text-xs bg-accent/10 dark:bg-accent/20 hover:bg-accent/20 dark:hover:bg-accent/30 text-accent dark:text-accent-light font-medium py-1.5 px-3 rounded transition-colors"
                    >
                      Search Another Address
                    </button>
                  </div>
                )}
                
                {/* Analyze button for non-default addresses */}
                {!isDefaultAddress && selectedListing && (
                  <button
                    onClick={fetchPhotos}
                    disabled={!selectedListing || isLoading || isDetecting}
                    className="w-full bg-accent hover:bg-accent-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

                {/* Help hint when no address selected */}
                {!isDefaultAddress && !selectedListing && address.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Select an address from the suggestions above to analyze
                  </p>
                )}
              </div>
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
                <p className="text-sm text-[#111827] mb-3">
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
        )}

        {/* Scrollable content area - boxed sections */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Photo preview grid - boxed and scrollable */}
          {photos.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-[#E5E7EB]">
              <h3 className="text-xs font-semibold text-[#111827] mb-2">
                Property Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded overflow-hidden"
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

          {/* Auto detected inventory and quote - boxed sections */}
          {(detections.length > 0 || isDetecting) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Auto detected inventory - boxed and scrollable */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-[#E5E7EB] flex flex-col">
                <h3 className="text-xs font-semibold text-[#111827] mb-2">
                  Auto detected inventory
                </h3>
                {isDetecting ? (
                  <div className="text-xs text-[#374151]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-0.5">
                        <span className="inline-block w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }}></span>
                        <span className="inline-block w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1s' }}></span>
                        <span className="inline-block w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1s' }}></span>
                      </div>
                      <span className="italic animate-pulse">Detecting inventory...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    {Object.entries(roomGroups).map(([room, items]) => {
                      const itemCounts: { [key: string]: number } = {};
                      items.forEach(item => {
                        itemCounts[item.label] = (itemCounts[item.label] || 0) + (item.qty || 1);
                      });
                      const itemList = Object.entries(itemCounts)
                        .map(([label, count]) => `${count} ${label}`)
                        .join(', ');
                      return (
                        <div key={room} className="text-[#374151]">
                          <span className="font-medium">{room}:</span> {itemList}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quote estimate - boxed */}
              <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-3 border border-accent/20 dark:border-accent/30">
                <h3 className="text-xs font-semibold text-[#111827] mb-2">
                  Quote estimate
                </h3>
                {isDetecting ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#374151]">Analyzing...</span>
                      <span className="font-semibold text-[#111827]">-</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#374151]">Estimated hours:</span>
                      <span className="font-semibold text-[#111827]">{estimatedHours} hrs</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#374151]">Estimated cost:</span>
                      <span className="font-semibold text-accent dark:text-accent-light">${estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#374151]">Items detected:</span>
                      <span className="font-semibold text-[#111827]">{detections.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
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

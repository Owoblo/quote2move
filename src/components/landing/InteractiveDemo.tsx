import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { parseZillowPhotos } from '../../lib/zillowPhotos';
import { detectFurniture } from '../../lib/aiDetectionServices';
import { Photo, Detection } from '../../types';
import PropertyInfo from '../PropertyInfo';

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
  hideSearch?: boolean;
  triggerFetch?: boolean;
  selectedListingData?: any;
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

  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
      setIsDefaultAddress(initialAddress === DEFAULT_ADDRESS);
    }
  }, [initialAddress, address]);

  useEffect(() => {
    if (selectedListingData) {
      setSelectedListing(selectedListingData);
    }
  }, [selectedListingData]);

  const loadCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        if (data.address === DEFAULT_ADDRESS && Date.now() - data.timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
    return null;
  }, []);

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

  useEffect(() => {
    if (address === DEFAULT_ADDRESS && photos.length === 0 && !isTyping) {
      setIsTyping(true);
      setDisplayAddress('');
      const fullText = DEFAULT_ADDRESS;
      let currentIndex = 0;
      let showCursor = true;
      
      const cursorInterval = setInterval(() => {
        showCursor = !showCursor;
      }, 530);
      
      const typeInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          const cursor = showCursor ? '|' : '';
          setDisplayAddress(fullText.slice(0, currentIndex + 1) + cursor);
          currentIndex++;
        } else {
          setDisplayAddress(fullText + '|');
          clearInterval(typeInterval);
          setTimeout(() => {
            clearInterval(cursorInterval);
            setDisplayAddress(fullText);
            setIsTyping(false);
          }, 500);
        }
      }, 50);
      
      return () => {
        clearInterval(typeInterval);
        clearInterval(cursorInterval);
      };
    } else if (address !== DEFAULT_ADDRESS) {
      setDisplayAddress(address);
    }
  }, [address, photos.length, isTyping]);

  useEffect(() => {
    const autoStartDefault = async () => {
      if (address === DEFAULT_ADDRESS && photos.length === 0 && !isTyping) {
        setIsDefaultAddress(true);
        
        await new Promise(resolve => setTimeout(resolve, DEFAULT_ADDRESS.length * 50 + 500));
        
        const cached = loadCachedData();
        if (cached) {
          setIsDetecting(true);
          await new Promise(resolve => setTimeout(resolve, 1800));
          setPhotos(cached.photos);
          setDetections(cached.detections);
          setIsDetecting(false);
          return;
        }

        try {
          setIsDetecting(true);
          
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

            let photoUrls: string[] = [];
            if (listing.carousel_photos_composable) {
              photoUrls = parseZillowPhotos(listing.carousel_photos_composable);
            }

            if (photoUrls.length > 0) {
              const interiorPhotos = photoUrls.slice(4);
              
              const formattedPhotos: Photo[] = interiorPhotos.map((url, index) => ({
                id: `photo-${index}`,
                url: url,
                thumbnailUrl: url,
                filename: `property-photo-${index + 1}.jpg`,
                uploadedAt: new Date()
              }));

              setPhotos(formattedPhotos);

              const detectedItems = await detectFurniture(interiorPhotos);
              
              setDetections(detectedItems);
              setIsDetecting(false);

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

  useEffect(() => {
    const searchListings = async () => {
      if (address.length < 3 || address === DEFAULT_ADDRESS) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsDefaultAddress(false);

      try {
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
            .limit(3),
          supabase
            .from('sold_listings')
            .select('*')
            .or(query)
            .limit(3)
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

      if (selectedListing.carousel_photos_composable) {
        photoUrls = parseZillowPhotos(selectedListing.carousel_photos_composable);
      } else {
        const addressParts = selectedListing.address.split(',').map(s => s.trim());
        const streetAddress = addressParts[0] || selectedListing.address;
        const city = addressParts[1] || selectedListing.addresscity || '';
        const state = addressParts[2] || selectedListing.addressstate || '';
        
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
            .limit(3),
          supabase
            .from('sold_listings')
            .select('id, address, addresscity, addressstate, carousel_photos_composable')
            .or(searchQuery)
            .limit(3)
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
        const photosToShow = isDefaultAddress ? photoUrls.slice(4) : photoUrls;
        
        const formattedPhotos: Photo[] = photosToShow.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          thumbnailUrl: url,
          filename: `property-photo-${index + 1}.jpg`,
          uploadedAt: new Date()
        }));

        setPhotos(formattedPhotos);
        setSearchCount(prev => {
          const next = prev + 1;
          searchCountRef.current = next;
          return next;
        });

        setIsDetecting(true);
        const detectedItems = await detectFurniture(photosToShow);
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
      fetchPhotos();
    }
  }, [triggerFetch, selectedListing, isLoading, isDetecting, fetchPhotos]);

  const estimatedHours = 8;
  const estimatedCost = 1950;

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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-border p-6 shadow-lg">
          <div className="chip mb-3 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800">
            See it work right now
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Type any property address. We'll pull MLS photos and show you what MovSense detects—live.
          </h3>
          <p className="text-sm text-text-secondary">
            💡 Try: <button type="button" className="text-primary hover:underline font-medium" onClick={() => setAddress('245 Carlaw Ave #403, Toronto, ON')}>245 Carlaw Ave #403, Toronto</button> or any listing with photos.
          </p>
        </div>
      )}
      
      <div className="bg-card-bg rounded-2xl shadow-2xl border border-border p-6 max-h-[600px] flex flex-col">
        {!hideSearch && (
          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Property Address
            </label>
            <div className="relative">
              <div className="flex items-center space-x-2 px-3 py-2.5 bg-surface border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
                  disabled={isDetecting || showSignupPrompt}
                />
              </div>

              {showSuggestions && suggestions.length > 0 && !selectedListing && (
                <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((listing, index) => (
                    <div
                      key={`${listing.id}-${index}`}
                      onClick={() => handleSuggestionClick(listing)}
                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                    >
                      <div className="text-sm font-medium text-text-primary">
                        {listing.address}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {listing.addresscity}, {listing.addressstate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!showSignupPrompt && (
              <div className="mt-3 space-y-2">
                {isDefaultAddress && photos.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-text-secondary mb-2">
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
                      className="w-full text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary font-medium py-2 px-3 rounded-lg border border-border transition-colors"
                    >
                      Search Another Address
                    </button>
                  </div>
                )}
                
                {!isDefaultAddress && selectedListing && (
                  <button
                    onClick={fetchPhotos}
                    disabled={!selectedListing || isLoading || isDetecting}
                    className="btn btn-primary w-full justify-center"
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

                {!isDefaultAddress && !selectedListing && address.length > 0 && (
                  <p className="text-xs text-text-muted text-center animate-pulse">
                    Select an address from the suggestions above to analyze
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {showSignupPrompt && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-text-primary mb-3">
                  You've used {MAX_DEMO_SEARCHES} free searches! Sign up to get unlimited access.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary w-full justify-center"
                >
                  Sign Up for Free
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {selectedListing && <PropertyInfo listing={selectedListing} />}
          
          {photos.length > 0 && (
            <div className="bg-surface rounded-xl p-3 border border-border">
              <h3 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-wider">
                Property Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={photo.url}
                      alt="Property"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(detections.length > 0 || isDetecting) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3 border border-border flex flex-col">
                <h3 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-wider">
                  Auto detected inventory
                </h3>
                {isDetecting ? (
                  <div className="text-xs text-text-secondary">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }}></span>
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1s' }}></span>
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1s' }}></span>
                      </div>
                      <span className="font-medium animate-pulse text-primary">Detecting inventory...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                    {Object.entries(roomGroups).map(([room, items]) => {
                      const itemCounts: { [key: string]: number } = {};
                      items.forEach(item => {
                        itemCounts[item.label] = (itemCounts[item.label] || 0) + (item.qty || 1);
                      });
                      const itemList = Object.entries(itemCounts)
                        .map(([label, count]) => `${count} ${label}`)
                        .join(', ');
                      return (
                        <div key={room} className="text-text-secondary border-l-2 border-primary/20 pl-2">
                          <span className="font-bold text-text-primary block mb-0.5">{room}</span>
                          <span className="leading-relaxed opacity-90">{itemList}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <h3 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-wider">
                  Quote estimate
                </h3>
                {isDetecting ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary animate-pulse">Calculating...</span>
                      <span className="font-semibold text-text-primary">-</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-text-secondary">Estimated hours</span>
                      <span className="font-bold text-text-primary bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-border">{estimatedHours} hrs</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-text-secondary">Estimated cost</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">${estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center pt-2 border-t border-border/50">
                      <span className="text-text-secondary">Items detected</span>
                      <span className="font-bold text-primary">{detections.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {searchCount > 0 && !showSignupPrompt && (
        <div className="mt-3 text-center">
          <p className="text-xs text-text-muted">
            {searchCount} of {MAX_DEMO_SEARCHES} free searches used • <Link to="/login" className="text-primary hover:underline font-medium">Sign up</Link> for unlimited
          </p>
        </div>
      )}
    </div>
  );
}

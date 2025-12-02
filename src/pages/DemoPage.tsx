import React, { useState, useCallback, useEffect } from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import SearchPanel from '../components/SearchPanel';
import PhotoGallery from '../components/PhotoGallery';
import InventoryTable from '../components/InventoryTable';
import PropertyInfo from '../components/PropertyInfo';
import { AppState, Photo, MappingTable, QuotePayload, Detection, PropertyContext } from '../types';
import { FurnitureDetectionService } from '../lib/furnitureDetection';
import { parseZillowPhotos } from '../lib/zillowPhotos';
import { supabaseSold2Move } from '../lib/supabase';
import { toCSV } from '../lib/export';

const mockMapping: MappingTable = {
  'Sofa': { cf: 25, minutes: 30, wrap: true },
  'Dining Table': { cf: 15, minutes: 20, wrap: true },
  'Refrigerator': { cf: 35, minutes: 45, wrap: false },
  'Chair': { cf: 3, minutes: 5, wrap: true },
  'Bed': { cf: 20, minutes: 25, wrap: true },
  'Dresser': { cf: 12, minutes: 15, wrap: true },
  'TV': { cf: 8, minutes: 10, wrap: true },
  'Bookshelf': { cf: 10, minutes: 12, wrap: false }
};

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

export default function DemoPage() {
  const [address, setAddress] = useState('');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isActiveRegion, setIsActiveRegion] = useState<boolean | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [triggerFetch, setTriggerFetch] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Check if listing is in active region
  const checkActiveRegion = (listing: any | null) => {
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
    setSelectedListing(listing);
    checkActiveRegion(listing);
  };

  const handleClear = () => {
    setAddress('');
    setSelectedListing(null);
    setIsActiveRegion(null);
    setPhotos([]);
    setDetections([]);
    setSelectedPhotos([]);
  };

  const handleFetchPhotos = async () => {
    if (!selectedListing) {
      addToast('Please select a listing from the dropdown first', 'error');
      return;
    }
    
    try {
      // Check if the listing has carousel_photos_composable data
      if (selectedListing.carousel_photos_composable) {
        try {
          const photoUrls = parseZillowPhotos(selectedListing.carousel_photos_composable);

          if (photoUrls.length > 0) {
            const newPhotos: Photo[] = photoUrls.map((url: string, index: number) => ({
              id: `photo-${index}`,
              url: url,
              thumbnailUrl: url,
              filename: `property-photo-${index + 1}.jpg`,
              uploadedAt: new Date()
            }));

            setPhotos(newPhotos);
            addToast(`Found ${newPhotos.length} photos - Starting AI detection...`, 'success');

            // Automatically select all photos and start detection
            const allPhotoIds = newPhotos.map(photo => photo.id);
            setSelectedPhotos(allPhotoIds);
            await runAutomaticDetection(newPhotos);

          } else {
            setPhotos([]);
            addToast('No photos found for this listing', 'error');
          }
        } catch (error) {
          console.error('Error parsing carousel_photos_composable:', error);
          setPhotos([]);
          addToast('Error parsing carousel data', 'error');
        }
      } else {
        // Search database
        await fetchPhotosFromDatabase(selectedListing.address);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
      addToast('Error fetching photos', 'error');
    }
  };

  const fetchPhotosFromDatabase = async (address: string) => {
    try {
      // Optimized search strategy
      const addressParts = address.split(' ');
      const houseNumber = addressParts[0];
      const streetName = addressParts.slice(1, 3).join(' ');
      
      const searchTerms = [
        `${houseNumber} ${streetName}`,
        address.split(',')[0],
        houseNumber
      ].filter(term => term && term.length > 0);
      
      let listing = null;
      
      for (const term of searchTerms) {
        const { data: currentListings } = await supabaseSold2Move
          .from('just_listed')
          .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
          .ilike('address', `%${term}%`)
          .limit(1);
          
        if (currentListings && currentListings.length > 0) {
          listing = currentListings[0];
          break;
        }

        const { data: soldListings } = await supabaseSold2Move
          .from('sold_listings')
          .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
          .ilike('address', `%${term}%`)
          .limit(1);

        if (soldListings && soldListings.length > 0) {
          listing = soldListings[0];
          break;
        }
      }

      if (listing && listing.carousel_photos_composable) {
        const photoUrls = parseZillowPhotos(listing.carousel_photos_composable);
        
        if (photoUrls.length > 0) {
          const newPhotos: Photo[] = photoUrls.map((url: string, index: number) => ({
            id: `photo-${index}`,
            url: url,
            thumbnailUrl: url,
            filename: `property-photo-${index + 1}.jpg`,
            uploadedAt: new Date()
          }));
          
          setPhotos(newPhotos);
          addToast(`Found ${newPhotos.length} photos - Starting AI detection...`, 'success');
          
          const allPhotoIds = newPhotos.map(photo => photo.id);
          setSelectedPhotos(allPhotoIds);
          await runAutomaticDetection(newPhotos);
        } else {
          setPhotos([]);
          addToast('No photos found for this listing', 'error');
        }
      } else {
        setPhotos([]);
        addToast('No listing found in database for this address', 'error');
      }
    } catch (error) {
      console.error('Error searching database:', error);
      setPhotos([]);
      addToast('Error searching database', 'error');
    }
  };

  const runAutomaticDetection = async (photos: Photo[]) => {
    try {
      setIsDetecting(true);
      setDetections([]);
      
      const propertyContext: PropertyContext | undefined = selectedListing?.hdpdata?.homeInfo ? {
        bedrooms: selectedListing.hdpdata.homeInfo.bedrooms,
        bathrooms: selectedListing.hdpdata.homeInfo.bathrooms,
        sqft: selectedListing.hdpdata.homeInfo.lotAreaValue,
        propertyType: selectedListing.hdpdata.homeInfo.homeType
      } : undefined;

      // Simple detection for demo
      const photoUrls = photos.map(p => p.url);
      const { rooms } = await FurnitureDetectionService.classifyRooms(photoUrls, propertyContext);
      
      let allDetections: Detection[] = [];
      
      for (const [roomName, roomPhotos] of Object.entries(rooms)) {
        const { detections: roomDetections } = await FurnitureDetectionService.detectFurnitureInRoom(
          roomName,
          roomPhotos,
          propertyContext
        );
        
        if (roomDetections.length > 0) {
          allDetections = [...allDetections, ...roomDetections];
          setDetections(prev => [...prev, ...roomDetections]);
        }
      }
      
      addToast(`Detection complete! Found ${allDetections.length} items`, 'success');
    } catch (error) {
      console.error('Detection error:', error);
      addToast('AI detection failed', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePhotoSelect = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAllPhotos = () => {
    setSelectedPhotos(photos.map(p => p.id));
  };

  const handleDeselectAllPhotos = () => {
    setSelectedPhotos([]);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setDetections(prev => prev.map((d, i) => i === index ? { ...d, qty } : d));
  };

  const handleNotesChange = (index: number, notes: string) => {
    setDetections(prev => prev.map((d, i) => i === index ? { ...d, notes } : d));
  };

  const handleRemove = (index: number) => {
    setDetections(prev => prev.filter((_, i) => i !== index));
  };

  const handleActivateAccount = () => {
    window.location.href = 'https://buy.stripe.com/3cI5kw04pfsI2BD3Vp1Nu00';
  };

  const handleCopyInventory = () => {
    const inventoryText = toCSV(detections);
    navigator.clipboard.writeText(inventoryText);
    addToast('Inventory copied to clipboard', 'success');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, source: 'demo_page_waitlist' }),
      });
      if (response.ok) {
        setLeadSubmitted(true);
        setLeadEmail('');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      setLeadSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] transition-colors duration-200 flex flex-col">
      <Navigation />

      <main className="flex-1 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-white mb-4 tracking-tight">
              Accurate moving quotes from <span className="text-gradient">just an address</span>.
            </h1>
            <p className="text-lg sm:text-xl text-[#374151] max-w-3xl mx-auto mb-6 sm:mb-8">
              Type any address in the activated cities below and watch MoveSense pull furniture and room data automatically from MLS photos.
            </p>
          </div>

          {/* Demo Workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column: Search & Photos */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100">
            <SearchPanel
              address={address}
              onAddressChange={handleAddressChange}
              onFetchPhotos={handleFetchPhotos}
              onClear={handleClear}
              recentSearches={[]}
              onListingSelect={handleListingSelect}
            />
                  {selectedListing && <div className="mt-4"><PropertyInfo listing={selectedListing} /></div>}
                  
                  {/* Active Regions Warning */}
                  {selectedListing && isActiveRegion === false && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                  This region isn't live yet. You can still get early access — activate your company's city below.
                </p>
              </div>
            )}
                </div>
                
                <div className="p-4 sm:p-6 bg-gray-50/50">
                  <PhotoGallery
                    photos={photos}
                    selectedPhotos={selectedPhotos}
                    onPhotoSelect={handlePhotoSelect}
                    onRunDetection={() => runAutomaticDetection(photos)}
                    isDetecting={isDetecting}
                    onSelectAll={handleSelectAllPhotos}
                    onDeselectAll={handleDeselectAllPhotos}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Inventory */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </span>
                    Inventory
                  </h2>
                  {detections.length > 0 && (
                    <button
                      onClick={handleCopyInventory}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                </div>
                <div className="flex-1 p-0 overflow-hidden">
                  <InventoryTable
                    detections={detections}
                    mapping={mockMapping}
                    onQuantityChange={handleQuantityChange}
                    onNotesChange={handleNotesChange}
                    onRemove={handleRemove}
                    isDetecting={isDetecting}
                  />
              </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to streamline your moving business?</h2>
            <button
              onClick={handleActivateAccount}
              className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Activate Your Account
            </button>
          </div>
        </div>
      </main>

      {/* Lead Capture Section */}
      <section className="py-16 px-6 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all shadow-sm"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <p className="text-green-800">
                ✓ Thanks! We'll notify you when MoveSense is available in your area.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Toast Notifications */}
      <div className="fixed top-24 right-6 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right duration-300 ${
              toast.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' :
              toast.type === 'warning' ? 'bg-yellow-50 text-yellow-900 border border-yellow-200' :
              'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

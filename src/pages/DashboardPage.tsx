import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '../components/SearchPanel';
import PhotoGallery from '../components/PhotoGallery';
import InventoryTable from '../components/InventoryTable';
import ProjectHistory from '../components/ProjectHistory';
import ThemeToggle from '../components/ThemeToggle';
import MovSenseLogo from '../components/MovSenseLogo';
import { AppState, Photo, MappingTable, QuotePayload } from '../types';
import { calculateEstimate } from '../lib/estimate';
import { toCSV, generatePdf, downloadFile } from '../lib/export';
import { parseZillowPhotos } from '../lib/zillowPhotos';
import { FurnitureDetectionService } from '../lib/furnitureDetection';
import { supabase } from '../lib/supabase';
import { ProjectService, Project } from '../lib/projectService';
import { QuoteService } from '../lib/quoteService';
import { FollowUpService } from '../lib/followUpService';
import { CalendarService } from '../lib/calendarService';
import { StatePersistence } from '../lib/statePersistence';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>({
    address: '',
    photos: [],
    detections: [],
    mapping: mockMapping,
    estimate: {
      crew: 3,
      rate: 75,
      travelMins: 30,
      stairs: false,
      elevator: false,
      wrapping: false,
      safetyPct: 10,
      hours: 0,
      total: 0
    }
  });

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'analytics' | 'quotes' | 'calendar'>('create');
  const [analytics, setAnalytics] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = StatePersistence.loadState();
    if (persisted) {
      if (persisted.address) {
        setState(prev => ({
          ...prev,
          address: persisted.address || prev.address,
          detections: persisted.detections || prev.detections,
          estimate: persisted.estimate || prev.estimate,
          mapping: persisted.mapping || prev.mapping
        }));
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (state.address || state.detections.length > 0) {
      StatePersistence.saveDashboardState(
        state.address,
        state.detections,
        state.estimate,
        state.mapping
      );
    }
  }, [state.address, state.detections, state.estimate, state.mapping]);

  // Load analytics and quotes when tab changes
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'quotes') {
      loadAnalytics();
      loadQuotes();
    }
    if (activeTab === 'calendar') {
      loadFollowUps();
      loadCalendarEvents();
    }
  }, [activeTab]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await QuoteService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      addToast('Failed to load analytics', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadQuotes = async () => {
    try {
      const data = await QuoteService.getUserQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      addToast('Failed to load quotes', 'error');
    }
  };

  const loadFollowUps = async () => {
    try {
      const data = await FollowUpService.getPendingFollowUps();
      setFollowUps(data);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const events = await CalendarService.getCalendarEvents(startDate, endDateStr);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  // Update estimate when detections or estimate params change
  useEffect(() => {
    if (state.detections.length > 0) {
      const result = calculateEstimate(state.detections, state.mapping, {
        crew: state.estimate.crew,
        rate: state.estimate.rate,
        travelMins: state.estimate.travelMins,
        stairs: state.estimate.stairs,
        elevator: state.estimate.elevator,
        wrapping: state.estimate.wrapping,
        safetyPct: state.estimate.safetyPct
      });

      setState(prev => ({
        ...prev,
        estimate: {
          ...prev.estimate,
          hours: result.hours,
          total: result.total
        }
      }));
    }
  }, [state.detections, state.mapping, state.estimate.crew, state.estimate.rate, state.estimate.travelMins, state.estimate.stairs, state.estimate.elevator, state.estimate.wrapping, state.estimate.safetyPct]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const handleAddressChange = (address: string) => {
    setState(prev => ({ ...prev, address }));
    // State will be saved automatically via useEffect
  };

  const handleListingSelect = (listing: any) => {
    setSelectedListing(listing);
  };

  const handleFetchPhotos = async () => {
    if (!selectedListing) {
      addToast('Please select a listing from the autocomplete first', 'error');
      return;
    }
    
    try {
      console.log('Fetching photos for selected listing:', selectedListing.address);
      console.log('Has carousel_photos_composable:', !!selectedListing.carousel_photos_composable);
      
      // Check if the listing has carousel_photos_composable data
      if (selectedListing.carousel_photos_composable) {
        try {
          // Use the utility function to parse Zillow photos
          const photoUrls = parseZillowPhotos(selectedListing.carousel_photos_composable);
          
          console.log('Parsed photo URLs:', photoUrls.length);
          
          if (photoUrls.length > 0) {
            // Convert URLs to Photo format
            const photos: Photo[] = photoUrls.map((url: string, index: number) => ({
              id: `photo-${index}`,
              url: url,
              thumbnailUrl: url, // Zillow URLs are already optimized
              filename: `property-photo-${index + 1}.jpg`,
              uploadedAt: new Date()
            }));
            
            setState(prev => ({ ...prev, photos }));
            addToast(`Found ${photos.length} photos - Starting AI detection...`, 'success');
            
            // Automatically select all photos and start detection
            const allPhotoIds = photos.map(photo => photo.id);
            setSelectedPhotos(allPhotoIds);
            
            // Start AI detection automatically
            await runAutomaticDetection(photos);
            
          } else {
            // No photos found
            setState(prev => ({ ...prev, photos: [] }));
            addToast('No photos found for this listing', 'error');
          }
        } catch (error) {
          console.error('Error parsing carousel_photos_composable:', error);
          // No fallback - show error
          setState(prev => ({ ...prev, photos: [] }));
          addToast('Error parsing carousel data', 'error');
        }
      } else {
        // No carousel_photos_composable data - try to fetch from database
        console.log('No carousel data in selected listing, searching database...');
        await fetchPhotosFromDatabase(selectedListing.address);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      // No fallback - show error
      setState(prev => ({ ...prev, photos: [] }));
      addToast('Error fetching photos', 'error');
    }
  };

  const fetchPhotosFromDatabase = async (address: string) => {
    try {
      console.log('🔍 Searching database for photos:', address);
      
      // Optimized search strategy for 40,000+ records
      const addressParts = address.split(' ');
      const houseNumber = addressParts[0];
      const streetName = addressParts.slice(1, 3).join(' '); // First 2 words after house number
      
      // Prioritize more specific searches first to reduce database load
      const searchTerms = [
        `${houseNumber} ${streetName}`, // Most specific: house + street
        address.split(',')[0], // Street address only
        houseNumber, // Just house number (fastest search)
        address, // Full address (least likely to match)
        streetName, // Just street name (broader search)
        address.replace(/[,\s]+/g, ' ').trim() // Cleaned address
      ].filter(term => term && term.length > 0);
      
      console.log('🔍 Search terms to try:', searchTerms);
      
      // Search both tables with simpler queries to avoid URL encoding issues
      let currentListings: any = { data: null, error: null };
      let soldListings: any = { data: null, error: null };
      
      // Try each search term until we find results
      for (const term of searchTerms) {
        console.log(`🔍 Trying search term: "${term}"`);
        
        if (!currentListings.data || currentListings.data.length === 0) {
          console.log(`🔍 Searching just_listed for: "${term}"`);
          try {
            // Use timeout to prevent hanging on large datasets
            const searchPromise = supabase
              .from('just_listed')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .ilike('address', `%${term}%`)
              .limit(3); // Reduced limit for faster queries
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Search timeout')), 10000)
            );
            
            currentListings = await Promise.race([searchPromise, timeoutPromise]);
            
            if (currentListings.error) {
              console.error('❌ Error searching just_listed:', currentListings.error);
            } else {
              console.log(`📊 just_listed results: ${currentListings.data?.length || 0} found`);
            }
          } catch (error) {
            console.error('❌ Timeout or error searching just_listed:', error);
            currentListings = { data: null, error };
          }
        }
        
        if (!soldListings.data || soldListings.data.length === 0) {
          console.log(`🔍 Searching sold_listings for: "${term}"`);
          try {
            // Use timeout to prevent hanging on large datasets
            const searchPromise = supabase
              .from('sold_listings')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .ilike('address', `%${term}%`)
              .limit(3); // Reduced limit for faster queries
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Search timeout')), 10000)
            );
            
            soldListings = await Promise.race([searchPromise, timeoutPromise]);
            
            if (soldListings.error) {
              console.error('❌ Error searching sold_listings:', soldListings.error);
            } else {
              console.log(`📊 sold_listings results: ${soldListings.data?.length || 0} found`);
            }
          } catch (error) {
            console.error('❌ Timeout or error searching sold_listings:', error);
            soldListings = { data: null, error };
          }
        }
        
        // If we found results, break
        if ((currentListings.data && currentListings.data.length > 0) || 
            (soldListings.data && soldListings.data.length > 0)) {
          console.log(`✅ Found results with term: "${term}"`);
          break;
        }
      }
      
      // If no results found with partial matching, try exact matching for better performance
      if ((!currentListings.data || currentListings.data.length === 0) && 
          (!soldListings.data || soldListings.data.length === 0)) {
        console.log('🔍 No results with partial matching, trying exact matching...');
        
        try {
          const exactSearchPromise = Promise.all([
            supabase
              .from('just_listed')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .eq('address', address)
              .limit(1),
            supabase
              .from('sold_listings')
              .select('id, address, addresscity, addressstate, carousel_photos_composable')
              .eq('address', address)
              .limit(1)
          ]);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Exact search timeout')), 5000)
          );
          
          const result = await Promise.race([exactSearchPromise, timeoutPromise]) as any;
          const [exactCurrent, exactSold] = result;
          
          if (exactCurrent.data && exactCurrent.data.length > 0) {
            currentListings = exactCurrent;
            console.log('✅ Found exact match in just_listed');
          }
          if (exactSold.data && exactSold.data.length > 0) {
            soldListings = exactSold;
            console.log('✅ Found exact match in sold_listings');
          }
        } catch (error) {
          console.log('❌ Exact search failed:', error);
        }
      }

      console.log('📊 Database search results:');
      console.log('Current listings found:', currentListings.data?.length || 0);
      console.log('Sold listings found:', soldListings.data?.length || 0);
      
      if (currentListings.data && currentListings.data.length > 0) {
        console.log('Current listings:', currentListings.data.map((l: any) => ({ id: l.id, address: l.address, city: l.addresscity, state: l.addressstate })));
      }
      if (soldListings.data && soldListings.data.length > 0) {
        console.log('Sold listings:', soldListings.data.map((l: any) => ({ id: l.id, address: l.address, city: l.addresscity, state: l.addressstate })));
      }

      const listing = currentListings.data?.[0] || soldListings.data?.[0];
      
      if (listing) {
        console.log('✅ Found listing:', {
          id: listing.id,
          address: listing.address,
          city: listing.addresscity,
          state: listing.addressstate,
          hasPhotos: !!listing.carousel_photos_composable
        });
        
        if (listing.carousel_photos_composable) {
          console.log('📸 Listing has photos, parsing...');
        
        try {
          // Use the utility function to parse Zillow photos
          const photoUrls = parseZillowPhotos(listing.carousel_photos_composable);
          
          console.log('Parsed photo URLs from database:', photoUrls.length);
          
          if (photoUrls.length > 0) {
            // Convert URLs to Photo format
            const photos: Photo[] = photoUrls.map((url: string, index: number) => ({
              id: `photo-${index}`,
              url: url,
              thumbnailUrl: url, // Zillow URLs are already optimized
              filename: `property-photo-${index + 1}.jpg`,
              uploadedAt: new Date()
            }));
            
            setState(prev => ({ ...prev, photos }));
            addToast(`Found ${photos.length} photos from database - Starting AI detection...`, 'success');
            
            // Automatically select all photos and start detection
            const allPhotoIds = photos.map(photo => photo.id);
            setSelectedPhotos(allPhotoIds);
            
            // Start AI detection automatically
            await runAutomaticDetection(photos);
            
          } else {
            // No photos found
            setState(prev => ({ ...prev, photos: [] }));
            addToast('No photos found for this listing', 'error');
          }
        } catch (error) {
          console.error('Error parsing carousel_photos_composable from database:', error);
          setState(prev => ({ ...prev, photos: [] }));
          addToast('Error parsing carousel data', 'error');
        }
        } else {
          console.log('❌ Listing found but no photos data');
          setState(prev => ({ ...prev, photos: [] }));
          addToast('No photos found for this listing', 'error');
        }
      } else {
        console.log('❌ No listing found in database for address:', address);
        setState(prev => ({ ...prev, photos: [] }));
        addToast('No listing found in database for this address', 'error');
      }
    } catch (error) {
      console.error('Error searching database for photos:', error);
      setState(prev => ({ ...prev, photos: [] }));
      addToast('Error searching database', 'error');
    }
  };

  const handleClear = () => {
    setState(prev => ({
      ...prev,
      address: '',
      photos: [],
      detections: []
    }));
    setSelectedPhotos([]);
    setSelectedListing(null);
    addToast('Cleared all data', 'success');
  };

  const handlePhotoSelect = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAllPhotos = () => {
    const allPhotoIds = state.photos.map(photo => photo.id);
    setSelectedPhotos(allPhotoIds);
  };

  const handleDeselectAllPhotos = () => {
    setSelectedPhotos([]);
  };

  const runAutomaticDetection = async (photos: Photo[]) => {
    try {
      setIsDetecting(true);
      setState(prev => ({ ...prev, detections: [] })); // Clear previous detections
      console.log('Starting automatic AI detection on', photos.length, 'photos');
      
      // Process photos one by one for real-time updates
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`Processing photo ${i + 1}/${photos.length}:`, photo.url);
        
        try {
          // Detect furniture in this single photo
          const photoDetections = await FurnitureDetectionService.detectFurniture([photo.url]);
          
          if (photoDetections.length > 0) {
            // Add new detections to existing ones
            setState(prev => ({
              ...prev,
              detections: [...prev.detections, ...photoDetections]
            }));
            
            console.log(`Photo ${i + 1}: Detected ${photoDetections.length} items`);
            
            // Show real-time toast for each photo
            addToast(`Photo ${i + 1}: Found ${photoDetections.length} items`, 'success');
          }
          
          // Small delay to show real-time updates
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error processing photo ${i + 1}:`, error);
          // Continue with next photo
        }
      }
      
      console.log('Automatic AI detection completed');
      addToast(`AI detection completed! Found ${state.detections.length} total items`, 'success');
      
    } catch (error) {
      console.error('Automatic AI detection error:', error);
      addToast('AI detection failed. Please try again.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRunDetection = async () => {
    if (selectedPhotos.length === 0) {
      addToast('Please select photos first', 'error');
      return;
    }
    
    if (state.photos.length === 0) {
      addToast('No photos available for detection', 'error');
      return;
    }
    
    try {
      setIsDetecting(true);
      addToast('Starting AI furniture detection...', 'success');
      
      // Get selected photo objects
      const selectedPhotoObjects = state.photos.filter(photo => 
        selectedPhotos.includes(photo.id)
      );
      
      console.log('Running AI detection on', selectedPhotoObjects.length, 'photos');
      
      // Run AI detection
      const detections = await FurnitureDetectionService.analyzePhotos(selectedPhotoObjects);
      
      console.log('AI detection results:', detections);
      
      // Update state with detections
      setState(prev => ({ ...prev, detections }));
      
      addToast(`AI detection completed! Found ${detections.length} furniture items`, 'success');
      
    } catch (error) {
      console.error('AI detection error:', error);
      addToast('AI detection failed. Please try again.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleQuantityChange = (detectionIndex: number, quantity: number) => {
    setState(prev => ({
      ...prev,
      detections: prev.detections.map((detection, index) =>
        index === detectionIndex ? { ...detection, qty: quantity } : detection
      )
    }));
  };

  const handleNotesChange = (detectionIndex: number, notes: string) => {
    setState(prev => ({
      ...prev,
      detections: prev.detections.map((detection, index) =>
        index === detectionIndex ? { ...detection, notes } : detection
      )
    }));
  };


  const handleRemove = (detectionIndex: number) => {
    setState(prev => ({
      ...prev,
      detections: prev.detections.filter((_, index) => index !== detectionIndex)
    }));
    addToast('Item removed from inventory', 'success');
  };

  const handleSendSMS = () => {
    addToast('SMS quote sent successfully', 'success');
  };

  const handleSendEmail = () => {
    addToast('Email quote sent successfully', 'success');
  };

  const handleDownloadPDF = async () => {
    const quotePayload: QuotePayload = {
      address: state.address,
      detections: state.detections,
      estimate: state.estimate,
      timestamp: new Date()
    };
    
    const pdfBlob = await generatePdf(quotePayload);
    downloadFile(pdfBlob, 'quote.pdf', 'application/pdf');
    addToast('PDF downloaded successfully', 'success');
  };

  const handleCopyCSV = () => {
    const csvContent = toCSV(state.detections);
    navigator.clipboard.writeText(csvContent);
    addToast('CSV copied to clipboard', 'success');
  };

  const handleSaveProject = async () => {
    if (!state.address && state.detections.length === 0) {
      addToast('Please add an address or detections before saving', 'error');
      return;
    }

    try {
      setIsSaving(true);
      // Automatically use address as project name, fallback to "Untitled Project"
      const projectName = state.address || 'Untitled Project';

      if (currentProjectId) {
        // Update existing project
        await ProjectService.updateProject(
          currentProjectId,
          state.address,
          state.detections,
          state.estimate,
          projectName
        );
        addToast('Project updated successfully', 'success');
      } else {
        // Save new project
        const project = await ProjectService.saveProject(
          state.address,
          state.detections,
          state.estimate,
          projectName
        );
        setCurrentProjectId(project.id);
        addToast('Project saved successfully', 'success');
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      addToast(`Failed to save project: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = (project: Project) => {
    setState({
      address: project.address,
      photos: [], // Photos aren't saved, user will need to reload
      detections: project.detections,
      mapping: state.mapping, // Keep current mapping
      estimate: project.estimate
    });
    setCurrentProjectId(project.id);
    setSelectedPhotos([]);
    addToast('Project loaded successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">MovSense</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
              <button
                onClick={() => setShowProjectHistory(true)}
                className="text-sm font-medium text-accent dark:text-accent-light hover:text-accent-dark dark:hover:text-accent-light transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Project History</span>
              </button>
              <button
                onClick={handleSaveProject}
                disabled={isSaving || (!state.address && state.detections.length === 0)}
                className="text-sm font-medium bg-accent hover:bg-accent-dark disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-1 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{currentProjectId ? 'Update Project' : 'Save Project'}</span>
                  </>
                )}
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
              <select className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none focus:outline-none cursor-pointer">
                <option>San Francisco, CA</option>
                <option>Los Angeles, CA</option>
                <option>New York, NY</option>
                <option>Chicago, IL</option>
              </select>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create Quote
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'quotes'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Quotes
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Calendar & Reminders
              </button>
            </div>
          </div>

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {loadingAnalytics ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Quotes</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalQuotes}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                      <p className="text-3xl font-bold text-yellow-600">{analytics.pendingQuotes}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accepted</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.acceptedQuotes}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Declined</p>
                      <p className="text-3xl font-bold text-red-600">{analytics.declinedQuotes}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue</h3>
                      <p className="text-3xl font-bold text-green-600 mb-2">${analytics.totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">From accepted quotes</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
                      <p className="text-3xl font-bold text-blue-600 mb-2">{analytics.conversionRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversion rate</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Avg: ${analytics.averageQuoteValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quotes by Price Range</h3>
                    <div className="space-y-3">
                      {analytics.quotesByPriceRange.map((range: any) => (
                        <div key={range.range} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300">{range.range}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${(range.count / analytics.totalQuotes) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{range.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
                </div>
              )}
            </div>
          )}

          {/* Quotes List View */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {quotes.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-gray-600 dark:text-gray-400">No quotes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{quote.customerName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{quote.customerEmail}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Move Date: {quote.moveDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">${quote.totalAmount.toFixed(2)}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            quote.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => navigate(`/quote/${quote.id}`)}
                          className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-semibold"
                        >
                          View Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calendar & Reminders View */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Follow-ups Due */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Follow-ups Due</h3>
                  {followUps.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No follow-ups scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {followUps.map((followUp) => (
                        <div key={followUp.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                Follow-up: {new Date(followUp.follow_up_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Quote ID: {followUp.quote_id}</p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await FollowUpService.completeFollowUp(followUp.id);
                                  await loadFollowUps();
                                  addToast('Follow-up marked as completed', 'success');
                                } catch (error) {
                                  addToast('Failed to complete follow-up', 'error');
                                }
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Moves */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Moves (Next 30 Days)</h3>
                  {calendarEvents.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No upcoming moves</p>
                  ) : (
                    <div className="space-y-3">
                      {calendarEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{event.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(event.startDate).toLocaleDateString()} at {event.startTime}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{event.location}</p>
                          {event.notes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {event.notes.slice(0, 2).map((note: string, idx: number) => (
                                <p key={idx} className="text-xs text-gray-500 dark:text-gray-400">• {note}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Export Calendar */}
              {calendarEvents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Calendar</h3>
                  <button
                    onClick={() => {
                      const icsContent = CalendarService.exportToICS(calendarEvents);
                      const blob = new Blob([icsContent], { type: 'text/calendar' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'movsense-calendar.ics';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      addToast('Calendar exported successfully', 'success');
                    }}
                    className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-semibold"
                  >
                    Download Calendar (ICS)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Quote View */}
          {activeTab === 'create' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Search + Photos */}
                <div className="space-y-6">
                  <SearchPanel
                    address={state.address}
                    onAddressChange={handleAddressChange}
                    onFetchPhotos={handleFetchPhotos}
                    onClear={handleClear}
                    recentSearches={[]}
                    onListingSelect={handleListingSelect}
                  />
                  <PhotoGallery
                    photos={state.photos}
                    selectedPhotos={selectedPhotos}
                    onPhotoSelect={handlePhotoSelect}
                    onRunDetection={handleRunDetection}
                    isDetecting={isDetecting}
                    onSelectAll={handleSelectAllPhotos}
                    onDeselectAll={handleDeselectAllPhotos}
                  />
                </div>

                {/* Right Column: Inventory (Standalone) */}
                <div>
                  <InventoryTable
                    detections={state.detections}
                    mapping={state.mapping}
                    onQuantityChange={handleQuantityChange}
                    onNotesChange={handleNotesChange}
                    onRemove={handleRemove}
                    isDetecting={isDetecting}
                  />
                </div>
              </div>
            
              {/* Action Buttons - Full Width Below */}
              <div className="mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Export & Actions</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export inventory data and send quotes</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        if (state.detections.length === 0) {
                          addToast('Please detect items first before creating a quote', 'error');
                          return;
                        }
                        navigate('/estimate', {
                          state: {
                            address: state.address,
                            detections: state.detections,
                            estimate: state.estimate,
                            mapping: state.mapping
                          }
                        });
                      }}
                      disabled={state.detections.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Continue to Complete Quote</span>
                      {state.detections.length > 0 && (
                        <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                          {state.detections.length} items
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={handleSendSMS}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Send SMS Quote</span>
                    </button>
                    <button
                      onClick={handleSendEmail}
                      className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Send Email</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={handleCopyCSV}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Copy CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-md shadow-lg text-sm font-medium ${
              toast.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Project History Modal */}
      {showProjectHistory && (
        <ProjectHistory
          onLoadProject={handleLoadProject}
          onClose={() => setShowProjectHistory(false)}
        />
      )}
    </div>
  );
}




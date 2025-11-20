import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '../components/SearchPanel';
import UploadPanel from '../components/UploadPanel';
import ShareUploadLinkModal from '../components/ShareUploadLinkModal';
import CustomerUploadsPanel from '../components/CustomerUploadsPanel';
import PhotoGallery from '../components/PhotoGallery';
import InventoryTable from '../components/InventoryTable';
import ProjectHistory from '../components/ProjectHistory';
import ThemeToggle from '../components/ThemeToggle';
import PropertyInfo from '../components/PropertyInfo';
import NewQuoteModal from '../components/NewQuoteModal';
import ProjectsSidebar from '../components/ProjectsSidebar';
import { AppState, Photo, MappingTable, QuotePayload, Detection } from '../types';
import { calculateEstimate } from '../lib/estimate';
import { toCSV, generatePdf, downloadFile } from '../lib/export';
import { parseZillowPhotos } from '../lib/zillowPhotos';
import { FurnitureDetectionService } from '../lib/furnitureDetection';
import { PropertyContext } from '../lib/aiDetectionServices';
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
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([]);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [activeTab, setActiveTab] = useState<'create' | 'analytics' | 'quotes' | 'calendar'>('create');
  const [analytics, setAnalytics] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [classifiedRooms, setClassifiedRooms] = useState<Record<string, string[]>>({});
  const [currentDetectingRoom, setCurrentDetectingRoom] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'mls' | 'upload'>('mls');
  const [uploadedPropertyInfo, setUploadedPropertyInfo] = useState<{
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
  }>({});
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Auto-save current project to database
  const autoSaveProject = useCallback(async () => {
    if (!currentProject) return;

    try {
      setAutoSaveStatus('saving');

      await ProjectService.updateProject(currentProject.id, {
        detections: state.detections,
        estimate: state.estimate,
        photoUrls: state.photos.map(p => p.url),
        roomsClassified: classifiedRooms
      });

      setAutoSaveStatus('saved');
      console.log('[Dashboard] Auto-saved project:', currentProject.id);
    } catch (error) {
      console.error('[Dashboard] Auto-save failed:', error);
      setAutoSaveStatus('unsaved');
    }
  }, [currentProject, state.detections, state.estimate, state.photos, classifiedRooms]);

  // Auto-save when detections, estimate, or photos change
  useEffect(() => {
    if (!currentProject) return;

    const timeoutId = setTimeout(() => {
      autoSaveProject();
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeoutId);
  }, [currentProject, state.detections, state.estimate, state.photos, autoSaveProject]);

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

  const loadAnalytics = useCallback(async () => {
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
  }, [addToast]);

  const loadQuotes = useCallback(async () => {
    try {
      const data = await QuoteService.getUserQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      addToast('Failed to load quotes', 'error');
    }
  }, [addToast]);

  const loadFollowUps = useCallback(async () => {
    try {
      const data = await FollowUpService.getPendingFollowUps();
      setFollowUps(data);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    }
  }, []);

  const loadCalendarEvents = useCallback(async () => {
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
  }, []);

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
  }, [activeTab, loadAnalytics, loadQuotes, loadFollowUps, loadCalendarEvents]);

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

      // Create or load project for this MLS listing
      const mlsId = selectedListing.zpid || selectedListing.id || selectedListing.address;
      const project = await ProjectService.getOrCreateFromMLS(
        mlsId,
        selectedListing.address,
        {
          bedrooms: selectedListing.hdpdata?.homeInfo?.bedrooms,
          bathrooms: selectedListing.hdpdata?.homeInfo?.bathrooms,
          sqft: selectedListing.hdpdata?.homeInfo?.lotAreaValue
        }
      );

      setCurrentProject(project);
      setCurrentProjectId(project.id);
      console.log('[Dashboard] Created/loaded MLS project:', project.id);

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

            // Save photos to project
            await ProjectService.updateProject(project.id, {
              photoUrls: photos.map(p => p.url)
            });

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
              .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
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
              .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
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
              .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
              .eq('address', address)
              .limit(1),
            supabase
              .from('sold_listings')
              .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
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
    setUploadedPropertyInfo({});
    addToast('Cleared all data', 'success');
  };

  const handleUploadComplete = async (files: Array<{ url: string; type: 'image' | 'video' }>) => {
    try {
      console.log('📤 Upload complete:', files.length, 'files');
      addToast(`✅ Uploaded ${files.length} files successfully!`, 'success');

      // Convert uploaded files to Photo format
      const photos: Photo[] = files
        .filter(f => f.type === 'image') // For now, only process images
        .map((file, index) => ({
          id: `upload-${index}`,
          url: file.url,
          thumbnailUrl: file.url,
          filename: `upload-${index + 1}.jpg`,
          uploadedAt: new Date()
        }));

      if (photos.length === 0) {
        addToast('⚠️ No images to process. Videos will be supported soon!', 'warning');
        return;
      }

      // Create project for manual upload
      const project = await ProjectService.createProject({
        address: uploadedPropertyInfo.address || 'Manual Upload',
        source: 'manual_upload',
        bedrooms: uploadedPropertyInfo.bedrooms,
        bathrooms: uploadedPropertyInfo.bathrooms,
        sqft: uploadedPropertyInfo.sqft,
        photoUrls: photos.map(p => p.url)
      });

      setCurrentProject(project);
      setCurrentProjectId(project.id);
      console.log('[Dashboard] Created manual upload project:', project.id);

      setState(prev => ({ ...prev, photos }));
      addToast(`📸 Loaded ${photos.length} photos - Starting AI detection...`, 'success');

      // Automatically select all photos and start detection
      const allPhotoIds = photos.map(photo => photo.id);
      setSelectedPhotos(allPhotoIds);

      // Start AI detection automatically
      await runAutomaticDetection(photos);

    } catch (error) {
      console.error('Error processing uploads:', error);
      addToast('Error processing uploaded files', 'error');
    }
  };

  const handlePropertyInfoChange = (info: { address?: string; bedrooms?: number; bathrooms?: number; sqft?: number }) => {
    setUploadedPropertyInfo(info);
    if (info.address) {
      setState(prev => ({ ...prev, address: info.address || '' }));
    }
  };

  const handleLoadCustomerUpload = async (uploadId: string, data: any) => {
    try {
      console.log('Loading customer upload:', uploadId, data);

      // Create project from customer upload using ProjectService
      const project = await ProjectService.createFromCustomerUpload(
        uploadId,
        data.photos.map((p: Photo) => p.url)
      );

      setCurrentProject(project);
      setCurrentProjectId(project.id);
      console.log('[Dashboard] Created customer upload project:', project.id);

      // Set the photos
      setState(prev => ({ ...prev, photos: data.photos, address: data.propertyInfo.address || '' }));

      // Set uploaded property info for detection context
      setUploadedPropertyInfo({
        address: data.propertyInfo.address,
        bedrooms: data.propertyInfo.bedrooms,
        bathrooms: data.propertyInfo.bathrooms,
        sqft: data.propertyInfo.sqft
      });

      // Auto-select all photos
      const allPhotoIds = data.photos.map((photo: Photo) => photo.id);
      setSelectedPhotos(allPhotoIds);

      // Show success message
      addToast(`✅ Loaded ${data.photos.length} photos from ${data.customerInfo.name}`, 'success');

      // Automatically start detection
      await runAutomaticDetection(data.photos);

    } catch (error) {
      console.error('Error loading customer upload:', error);
      addToast('Failed to load customer upload', 'error');
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
      setClassifiedRooms({}); // Clear previous rooms
      setCurrentDetectingRoom(null);
      console.log('🏠 Starting 2-Phase AI Detection on', photos.length, 'photos');

      // Extract property context from selectedListing hdpdata or uploaded property info
      const propertyContext: PropertyContext | undefined = selectedListing?.hdpdata?.homeInfo ? {
        bedrooms: selectedListing.hdpdata.homeInfo.bedrooms,
        bathrooms: selectedListing.hdpdata.homeInfo.bathrooms,
        sqft: selectedListing.hdpdata.homeInfo.lotAreaValue,
        propertyType: selectedListing.hdpdata.homeInfo.homeType
      } : (uploadedPropertyInfo.bedrooms || uploadedPropertyInfo.bathrooms || uploadedPropertyInfo.sqft) ? {
        bedrooms: uploadedPropertyInfo.bedrooms,
        bathrooms: uploadedPropertyInfo.bathrooms,
        sqft: uploadedPropertyInfo.sqft,
        propertyType: 'SINGLE_FAMILY'
      } : undefined;

      console.log('🏠 Property Context:', propertyContext);

      // PHASE 1: Classify Rooms
      addToast('🏠 Classifying rooms...', 'success');
      const photoUrls = photos.map(p => p.url);

      const { rooms, metadata } = await FurnitureDetectionService.classifyRooms(photoUrls, propertyContext);

      setClassifiedRooms(rooms);
      const roomNames = Object.keys(rooms);
      console.log('✅ Classified', roomNames.length, 'rooms:', roomNames.join(', '));
      addToast(`✅ Found ${roomNames.length} rooms: ${roomNames.map(r => r.replace(/_/g, ' ')).join(', ')}`, 'success');

      // Small delay to let user see the rooms
      await new Promise(resolve => setTimeout(resolve, 1000));

      // PHASE 2: Detect Furniture Room by Room
      addToast('🔍 Detecting furniture room by room...', 'success');

      // Accumulate all detections locally
      const allDetections: Detection[] = [];

      for (const [roomName, roomPhotos] of Object.entries(rooms)) {
        const displayName = roomName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setCurrentDetectingRoom(roomName);

        console.log(`📍 Detecting in ${displayName} (${roomPhotos.length} photos)...`);
        addToast(`📍 Analyzing ${displayName}...`, 'success');

        try {
          const roomDetections = await FurnitureDetectionService.detectFurnitureInRoom(
            roomName,
            roomPhotos,
            propertyContext
          );

          if (roomDetections.length > 0) {
            // Add to local accumulator
            allDetections.push(...roomDetections);

            // Add room's detections to state incrementally for UI updates
            setState(prev => ({
              ...prev,
              detections: [...prev.detections, ...roomDetections]
            }));

            console.log(`✅ ${displayName}: Found ${roomDetections.length} items`);
            addToast(`✅ ${displayName}: ${roomDetections.length} items`, 'success');
          } else {
            console.log(`ℹ️ ${displayName}: No furniture detected`);
          }

          // Small delay between rooms for visual effect
          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
          console.error(`❌ Error detecting in ${displayName}:`, error);
          addToast(`⚠️ Error in ${displayName}`, 'warning');
        }
      }

      setCurrentDetectingRoom(null);

      console.log('✅ All rooms processed! Total items:', allDetections.length);
      addToast(`🎉 Detection complete! Found ${allDetections.length} items total`, 'success');

      // Save detections to project if we have a current project
      if (currentProject) {
        try {
          console.log('[Dashboard] Saving detections to project:', currentProject.id);
          await ProjectService.updateDetections(
            currentProject.id,
            allDetections,
            rooms
          );
          console.log('[Dashboard] ✅ Detections saved to project');
        } catch (error) {
          console.error('[Dashboard] Failed to save detections:', error);
          addToast('⚠️ Detections saved locally but failed to sync to database', 'warning');
        }
      }

      // Show validation warnings if any
      if (propertyContext?.bedrooms) {
        const bedsDetected = allDetections.filter(d =>
          d.label.toLowerCase().includes('bed') &&
          !d.label.toLowerCase().includes('nightstand')
        ).length;

        if (bedsDetected > propertyContext.bedrooms + 1) {
          addToast(`⚠️ Detected ${bedsDetected} beds in ${propertyContext.bedrooms}-bedroom property`, 'warning');
        }
      }

    } catch (error) {
      console.error('❌ Automatic AI detection error:', error);
      addToast('AI detection failed. Please try again.', 'error');
    } finally {
      setIsDetecting(false);
      setCurrentDetectingRoom(null);
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
        await ProjectService.updateProject(currentProjectId, {
          address: state.address,
          projectName: projectName,
          detections: state.detections,
          estimate: state.estimate
        });
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
        setCurrentProject(project);
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
    setCurrentProject(project);
    setSelectedPhotos([]);
    addToast('Project loaded successfully', 'success');
  };

  const handleSelectProject = async (project: Project) => {
    try {
      console.log('[Dashboard] Switching to project:', project.id);

      // Load project data into state
      setCurrentProject(project);
      setCurrentProjectId(project.id);

      setState({
        address: project.address,
        photos: project.photoUrls.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          thumbnailUrl: url,
          filename: `photo-${index + 1}.jpg`,
          uploadedAt: new Date()
        })),
        detections: project.detections,
        mapping: state.mapping,
        estimate: project.estimate || { total: 0, hours: 0, cubicFeet: 0, items: [] }
      });

      if (project.roomsClassified) {
        setClassifiedRooms(project.roomsClassified);
      }

      // Set uploaded property info if available
      if (project.bedrooms || project.bathrooms || project.sqft) {
        setUploadedPropertyInfo({
          address: project.address,
          bedrooms: project.bedrooms,
          bathrooms: project.bathrooms,
          sqft: project.sqft
        });
      }

      setActiveTab('create');
      addToast(`Loaded: ${project.projectName || project.address}`, 'success');
    } catch (error) {
      console.error('Error loading project:', error);
      addToast('Failed to load project', 'error');
    }
  };

  const handleNewQuoteClick = () => {
    setShowNewQuoteModal(true);
  };

  const handleNewQuoteMLS = () => {
    setInputMode('mls');
    setActiveTab('create');
    // Clear current project to start fresh
    setCurrentProject(null);
    setCurrentProjectId(null);
    setState(prev => ({
      ...prev,
      address: '',
      photos: [],
      detections: [],
      estimate: { total: 0, hours: 0, cubicFeet: 0, items: [] }
    }));
    setClassifiedRooms({});
    addToast('Ready to search MLS', 'success');
  };

  const handleNewQuoteManualUpload = () => {
    setInputMode('upload');
    setActiveTab('create');
    // Clear current project to start fresh
    setCurrentProject(null);
    setCurrentProjectId(null);
    setState(prev => ({
      ...prev,
      address: '',
      photos: [],
      detections: [],
      estimate: { total: 0, hours: 0, cubicFeet: 0, items: [] }
    }));
    setClassifiedRooms({});
    addToast('Ready to upload photos', 'success');
  };

  const handleNewQuoteCustomerUpload = () => {
    setShowShareLinkModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <ProjectsSidebar
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onNewQuote={handleNewQuoteClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                  {currentProject ? (currentProject.projectName || currentProject.address || 'Untitled Project') : 'MovSense Dashboard'}
                </h1>
                {currentProject && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentProject.source === 'mls' && '🏠 MLS'}
                    {currentProject.source === 'manual_upload' && '📤 Manual'}
                    {currentProject.source === 'customer_upload' && '📩 Customer'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="btn btn-ghost text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200/60 dark:border-gray-700/60">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-accent text-[#111827]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Create Quote
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-accent text-[#111827]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'quotes'
                    ? 'border-accent text-[#111827]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All Quotes
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-accent text-[#111827]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card card-hover section-padding">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Total Quotes</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.totalQuotes}</p>
                    </div>
                    <div className="card card-hover section-padding">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Pending</p>
                      <p className="text-2xl font-semibold text-yellow-600">{analytics.pendingQuotes}</p>
                    </div>
                    <div className="card card-hover section-padding">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Accepted</p>
                      <p className="text-2xl font-semibold text-green-600">{analytics.acceptedQuotes}</p>
                    </div>
                    <div className="card card-hover section-padding">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Declined</p>
                      <p className="text-2xl font-semibold text-red-600">{analytics.declinedQuotes}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card card-hover section-padding">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue</h3>
                      <p className="text-3xl font-semibold text-green-600 mb-1.5">${analytics.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">From accepted quotes</p>
                    </div>
                    <div className="card card-hover section-padding">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
                      <p className="text-3xl font-semibold text-accent mb-1.5">{analytics.conversionRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Conversion rate</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Avg: ${analytics.averageQuoteValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="card card-hover p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Quotes by Price Range</h3>
                    <div className="space-y-3">
                      {analytics.quotesByPriceRange.map((range: any) => (
                        <div key={range.range} className="flex items-center justify-between">
                          <span className="text-[#374151]">{range.range}</span>
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
                  <p className="text-[#374151]">No analytics data available</p>
                </div>
              )}
            </div>
          )}

          {/* Quotes List View */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {quotes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-[#374151]">No quotes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="card card-hover p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{quote.customerName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{quote.customerEmail}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Move Date: {quote.moveDate}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">${quote.totalAmount.toFixed(2)}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            quote.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            quote.status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/quote/${quote.id}`)}
                          className="btn btn-primary text-xs px-3 py-1.5"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/quote/${quote.id}/edit`)}
                          className="btn btn-secondary text-xs px-3 py-1.5"
                        >
                          Edit
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
                <div className="card card-hover p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Follow-ups Due</h3>
                  {followUps.length === 0 ? (
                    <p className="text-[#374151] text-sm">No follow-ups scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {followUps.map((followUp) => (
                        <div key={followUp.id} className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                Follow-up: {new Date(followUp.follow_up_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-[#374151]">Quote ID: {followUp.quote_id}</p>
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
                              className="btn btn-success text-xs px-2.5 py-1"
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
                <div className="card card-hover p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Upcoming Moves (Next 30 Days)</h3>
                  {calendarEvents.length === 0 ? (
                    <p className="text-[#374151] text-sm">No upcoming moves</p>
                  ) : (
                    <div className="space-y-3">
                      {calendarEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-md">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{event.title}</p>
                          <p className="text-xs text-[#374151] mt-1">
                            {new Date(event.startDate).toLocaleDateString()} at {event.startTime}
                          </p>
                          <p className="text-xs text-[#374151]">{event.location}</p>
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
                <div className="card card-hover p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Export Calendar</h3>
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
                    className="btn btn-primary text-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Calendar (ICS)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Quote View */}
          {activeTab === 'create' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Search + Photos */}
                <div className="space-y-5">
                  {/* Mode Toggle */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-200">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setInputMode('mls')}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                          inputMode === 'mls'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>MLS Search</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setInputMode('upload')}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                          inputMode === 'upload'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload Photos</span>
                        </div>
                      </button>
                    </div>

                    {/* Share Link Button */}
                    <div className="mt-3">
                      <button
                        onClick={() => setShowShareLinkModal(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Share Link with Customer</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Rendering Based on Mode */}
                  {inputMode === 'mls' ? (
                    <>
                      <SearchPanel
                        address={state.address}
                        onAddressChange={handleAddressChange}
                        onFetchPhotos={handleFetchPhotos}
                        onClear={handleClear}
                        recentSearches={[]}
                        onListingSelect={handleListingSelect}
                      />
                      {selectedListing && <PropertyInfo listing={selectedListing} />}
                    </>
                  ) : (
                    <>
                      <UploadPanel
                        onUploadComplete={handleUploadComplete}
                        onPropertyInfoChange={handlePropertyInfoChange}
                      />
                      <CustomerUploadsPanel onLoadUpload={handleLoadCustomerUpload} />
                    </>
                  )}
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
                <div className="card section-padding">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#111827] mb-2">Export & Actions</h2>
                      <p className="text-sm text-[#374151]">Export inventory data and send quotes</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
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
                : toast.type === 'warning'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
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

      {/* Share Upload Link Modal */}
      <ShareUploadLinkModal
        isOpen={showShareLinkModal}
        onClose={() => setShowShareLinkModal(false)}
      />

          {/* Auto-save Status Indicator */}
          {currentProject && (
            <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-xs z-50">
              {autoSaveStatus === 'saving' && (
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Auto-saved{' '}
                  {currentProject.lastAutoSave &&
                    new Date(currentProject.lastAutoSave).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {autoSaveStatus === 'unsaved' && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Save failed
                </span>
              )}
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewQuoteModal
        isOpen={showNewQuoteModal}
        onClose={() => setShowNewQuoteModal(false)}
        onSelectMLS={handleNewQuoteMLS}
        onSelectManualUpload={handleNewQuoteManualUpload}
        onSelectCustomerUpload={handleNewQuoteCustomerUpload}
      />
    </div>
  );
}




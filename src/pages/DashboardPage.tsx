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
import { supabase, supabaseSold2Move } from '../lib/supabase';
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
  const [totalDetectionTimeMs, setTotalDetectionTimeMs] = useState(0);

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
            const searchPromise = supabaseSold2Move
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
            const searchPromise = supabaseSold2Move
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
            supabaseSold2Move
              .from('just_listed')
              .select('id, address, addresscity, addressstate, carousel_photos_composable, hdpdata')
              .eq('address', address)
              .limit(1),
            supabaseSold2Move
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
      let totalTime = metadata.detectionTimeMs || 0;

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
          const { detections: roomDetections, detectionTimeMs } = await FurnitureDetectionService.detectFurnitureInRoom(
            roomName,
            roomPhotos,
            propertyContext
          );
          totalTime += detectionTimeMs;

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
      setTotalDetectionTimeMs(totalTime);

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
        estimate: project.estimate || {
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
    }));
    setClassifiedRooms({});
    addToast('Ready to upload photos', 'success');
  };

  const handleNewQuoteCustomerUpload = () => {
    setShowShareLinkModal(true);
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Sidebar */}
      <ProjectsSidebar
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onNewQuote={handleNewQuoteClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  {currentProject ? (currentProject.projectName || currentProject.address || 'Untitled Project') : 'Dashboard'}
                {currentProject && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {currentProject.source === 'mls' && 'MLS'}
                      {currentProject.source === 'manual_upload' && 'Manual'}
                      {currentProject.source === 'customer_upload' && 'Customer'}
                  </span>
                  )}
                </h1>
                {currentProject?.address && currentProject.address !== currentProject.projectName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-md">
                    {currentProject.address}
                  </p>
                )}
              </div>
            </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/settings')}
                className="btn btn-ghost text-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Navigation Tabs - Segmented Style */}
        <div className="px-4 sm:px-6 py-4 bg-surface border-b border-gray-100 dark:border-gray-800/50 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl relative whitespace-nowrap">
            <div className="flex space-x-1 relative z-10">
              {['create', 'analytics', 'quotes', 'calendar'].map((tab) => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'create' && ' Quote'}
              </button>
              ))}
            </div>
            </div>
          </div>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-background p-3 sm:p-6">
          <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">

          {/* Analytics View */}
          {activeTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
              {loadingAnalytics ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Quotes', value: analytics.totalQuotes, color: 'text-primary' },
                        { label: 'Pending', value: analytics.pendingQuotes, color: 'text-yellow-600' },
                        { label: 'Accepted', value: analytics.acceptedQuotes, color: 'text-green-600' },
                        { label: 'Declined', value: analytics.declinedQuotes, color: 'text-red-600' }
                      ].map((item, idx) => (
                        <div key={idx} className="card p-5 hover:shadow-lg transition-shadow">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                          <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                      ))}
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </span>
                          Revenue
                        </h3>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">${analytics.totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Total revenue from accepted quotes</p>
                    </div>
                      <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          </span>
                          Performance
                        </h3>
                        <div className="flex items-baseline gap-4">
                          <p className="text-4xl font-bold text-primary">{analytics.conversionRate.toFixed(1)}%</p>
                          <span className="text-sm text-gray-500 font-medium">Conversion Rate</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Avg. Quote Value: <span className="font-semibold text-gray-900 dark:text-white">${analytics.averageQuoteValue.toFixed(2)}</span></p>
                    </div>
                  </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-6">Quote Distribution by Price</h3>
                      <div className="space-y-4">
                      {analytics.quotesByPriceRange.map((range: any) => (
                          <div key={range.range} className="flex items-center">
                            <span className="w-32 text-sm text-gray-600 dark:text-gray-400 font-medium">{range.range}</span>
                            <div className="flex-1 mx-4 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${(range.count / analytics.totalQuotes) * 100}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-right text-sm font-bold text-gray-900 dark:text-white">{range.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                  <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500">No analytics data available yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Quotes List View */}
          {activeTab === 'quotes' && (
              <div className="space-y-4 animate-in fade-in duration-300">
              {quotes.length === 0 ? (
                  <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-gray-500 font-medium">No quotes generated yet</p>
                    <button onClick={() => setActiveTab('create')} className="btn btn-link mt-2">Create your first quote</button>
                </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                  {quotes.map((quote) => (
                      <div key={quote.id} className="card p-5 hover:shadow-lg transition-all group border border-transparent hover:border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-lg">
                              {quote.customerName.charAt(0)}
                        </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">{quote.customerName}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{quote.customerEmail}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900 dark:text-white">${quote.totalAmount.toFixed(2)}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                quote.outcome === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                quote.outcome === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                                {quote.outcome.charAt(0).toUpperCase() + quote.outcome.slice(1)}
                          </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/quote/${quote.id}`)}
                                className="btn btn-secondary text-sm px-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/quote/${quote.id}/edit`)}
                                className="btn btn-ghost text-sm p-2"
                        >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                            </div>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

            {/* Calendar View */}
          {activeTab === 'calendar' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card p-6 border-l-4 border-yellow-400">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Follow-ups Due
                      </h3>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">{followUps.length} Pending</span>
                    </div>
                  {followUps.length === 0 ? (
                      <p className="text-gray-500 text-sm">No follow-ups scheduled for today.</p>
                  ) : (
                    <div className="space-y-3">
                      {followUps.map((followUp) => (
                          <div key={followUp.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center group hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
                            <div>
                              <p className="font-semibold text-sm">{new Date(followUp.follow_up_date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">Quote #{followUp.quote_id.slice(0, 8)}</p>
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
                              className="btn btn-sm btn-ghost text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Done
                            </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                  <div className="card p-6 border-l-4 border-blue-500">
                     <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Upcoming Moves
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Next 30 Days</span>
                    </div>
                  {calendarEvents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No upcoming moves scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {calendarEvents.slice(0, 5).map((event) => (
                          <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.title}</p>
                              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{event.startTime}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {event.location}
                            </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Quote View */}
          {activeTab === 'create' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left Column: Input & Photos */}
                  <div className="space-y-6">
                    {/* Mode Selection */}
                    <div className="card p-2 bg-surface inline-flex rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                      <button
                        onClick={() => setInputMode('mls')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                          inputMode === 'mls'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        MLS Search
                      </button>
                      <button
                        onClick={() => setInputMode('upload')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                          inputMode === 'upload'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        Upload Photos
                      </button>
                    </div>

                    <div className="bg-surface rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  {inputMode === 'mls' ? (
                    <>
                          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                      <SearchPanel
                        address={state.address}
                        onAddressChange={handleAddressChange}
                        onFetchPhotos={handleFetchPhotos}
                        onClear={handleClear}
                        recentSearches={[]}
                        onListingSelect={handleListingSelect}
                      />
                            {selectedListing && <div className="mt-4"><PropertyInfo listing={selectedListing} /></div>}
                          </div>
                    </>
                  ) : (
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                      <UploadPanel
                        onUploadComplete={handleUploadComplete}
                        onPropertyInfoChange={handlePropertyInfoChange}
                      />
                          <div className="mt-4">
                      <CustomerUploadsPanel onLoadUpload={handleLoadCustomerUpload} />
                          </div>
                          <div className="mt-4">
                             <button
                                onClick={() => setShowShareLinkModal(true)}
                                className="w-full btn btn-secondary py-3 flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                Share Upload Link with Customer
                              </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
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
                    </div>
                </div>

                  {/* Right Column: Inventory */}
                  <div className="space-y-6">
                    <div className="bg-surface rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 h-full flex flex-col">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="p-1.5 bg-primary/10 rounded-md text-primary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          </span>
                          Inventory
                        </h2>
                        <div className="flex gap-2">
                          <button onClick={handleCopyCSV} className="btn btn-sm btn-ghost" title="Copy CSV">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 p-0 overflow-hidden">
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
                    </div>
                  </div>
                  
                {/* Floating Action Bar (Sticky Bottom) */}
                <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-surface/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 flex justify-center items-center gap-4 transition-transform duration-300 translate-y-0 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                   <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full max-w-5xl px-0 sm:px-4">
                      <div className="flex w-full sm:flex-1 items-center gap-2 justify-center sm:justify-start">
                         {/* Secondary Actions */}
                        <button onClick={handleDownloadPDF} className="flex-1 sm:flex-none btn btn-secondary px-3 sm:px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className="sm:inline">PDF</span>
                        </button>
                        <button onClick={handleSendEmail} className="flex-1 sm:flex-none btn btn-secondary px-3 sm:px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="sm:inline">Email</span>
                        </button>
                      </div>

                      {/* Primary Action */}
                    <button
                      onClick={() => {
                        if (state.detections.length === 0) {
                            addToast('Please detect items first', 'error');
                          return;
                        }
                        navigate('/estimate', {
                          state: {
                            address: state.address,
                            detections: state.detections,
                            estimate: state.estimate,
                            mapping: state.mapping,
                            totalDetectionTimeMs: totalDetectionTimeMs,
                            propertyContext: selectedListing?.hdpdata?.homeInfo ? {
                              bedrooms: selectedListing.hdpdata.homeInfo.bedrooms,
                              bathrooms: selectedListing.hdpdata.homeInfo.bathrooms,
                              sqft: selectedListing.hdpdata.homeInfo.lotAreaValue,
                              propertyType: selectedListing.hdpdata.homeInfo.homeType
                            } : (uploadedPropertyInfo.bedrooms || uploadedPropertyInfo.bathrooms || uploadedPropertyInfo.sqft) ? {
                              bedrooms: uploadedPropertyInfo.bedrooms,
                              bathrooms: uploadedPropertyInfo.bathrooms,
                              sqft: uploadedPropertyInfo.sqft,
                              propertyType: 'SINGLE_FAMILY'
                            } : undefined,
                            source: inputMode
                          }
                        });
                      }}
                      disabled={state.detections.length === 0}
                        className="btn btn-primary px-8 py-3 text-lg font-semibold shadow-lg shadow-primary/30 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all"
                      >
                        <span>Continue to Estimate</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  </div>
                  </div>
                </div>
          )}
          </div>
          
          {/* Spacer for sticky footer */}
          <div className="h-24"></div>
        </main>

        {/* Auto-save Status Indicator - moved to top right */}
        {currentProject && (
          <div className="fixed top-20 right-6 pointer-events-none z-30">
            {autoSaveStatus === 'saving' && (
              <span className="text-gray-400 text-xs flex items-center gap-1.5 bg-white/50 dark:bg-black/50 backdrop-blur rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                Saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-gray-400 text-xs flex items-center gap-1.5 bg-white/50 dark:bg-black/50 backdrop-blur rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Saved
              </span>
            )}
          </div>
        )}

        {/* Toast Notifications */}
        <div className="fixed top-20 right-6 space-y-2 z-50">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right duration-300 ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-900 border border-green-200 dark:bg-green-900/90 dark:text-green-100 dark:border-green-800'
                  : toast.type === 'warning'
                  ? 'bg-yellow-50 text-yellow-900 border border-yellow-200 dark:bg-yellow-900/90 dark:text-yellow-100 dark:border-yellow-800'
                  : 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/90 dark:text-red-100 dark:border-red-800'
              }`}
            >
              {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              {toast.type === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
              {toast.message}
            </div>
          ))}
        </div>
      </div>

    {/* Modals */}
    <NewQuoteModal
      isOpen={showNewQuoteModal}
      onClose={() => setShowNewQuoteModal(false)}
      onSelectMLS={handleNewQuoteMLS}
      onSelectManualUpload={handleNewQuoteManualUpload}
      onSelectCustomerUpload={handleNewQuoteCustomerUpload}
    />

    {showProjectHistory && (
      <ProjectHistory
        onLoadProject={handleLoadProject}
        onClose={() => setShowProjectHistory(false)}
      />
    )}

    <ShareUploadLinkModal
      isOpen={showShareLinkModal}
      onClose={() => setShowShareLinkModal(false)}
    />
  </div>
  );
}

import { Detection } from '../types';
import { estimateCubicFeet, estimateWeight } from './cubicFeetEstimator';

// Property context interface
export interface PropertyContext {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyType?: string;
}

// Phase 1: Room Classification ONLY
export const classifyRooms = async (
  photoUrls: string[],
  propertyContext?: PropertyContext
): Promise<{ rooms: Record<string, string[]>, metadata: any }> => {
  console.log('🏠 Phase 1: Classifying rooms...');

  try {
    const response = await fetch('/api/classifyRooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoUrls,
        propertyContext
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Rooms classified:', Object.keys(data.rooms || {}).length, 'rooms');

    return {
      rooms: data.rooms || {},
      metadata: data.metadata || {}
    };

  } catch (error: any) {
    console.error('❌ Room classification failed:', error);
    throw new Error(`Failed to classify rooms: ${error.message}`);
  }
};

// Phase 2: Detect furniture in a specific room
export const detectFurnitureInRoom = async (
  roomName: string,
  roomPhotos: string[],
  propertyContext?: PropertyContext
): Promise<Detection[]> => {
  console.log(`📍 Detecting furniture in ${roomName}...`);

  try {
    const response = await fetch('/api/detectFurniturePerRoom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        roomPhotos,
        propertyContext
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    const detections = data.detections || [];

    // Process detections
    const processedDetections: Detection[] = detections.map((detection: any) => ({
      label: detection.label || 'Unknown Item',
      qty: detection.qty || 1,
      confidence: detection.confidence || 0.5,
      notes: detection.notes || '',
      room: detection.room || roomName,
      size: detection.size || '',
      cubicFeet: detection.cubicFeet || estimateCubicFeet(detection.label || ''),
      weight: detection.weight || estimateWeight(detection.label || ''),
    }));

    console.log(`✅ ${roomName}: Found ${processedDetections.length} items`);
    return processedDetections;

  } catch (error: any) {
    console.error(`❌ Detection failed for ${roomName}:`, error);
    return [];
  }
};

// Furniture Detection - Now uses secure backend API
// The OpenAI API key is stored server-side and never exposed to the browser
export const detectFurniture = async (photoUrls: string[]): Promise<Detection[]> => {
  console.log('🔍 Starting furniture detection for', photoUrls.length, 'photos');
  console.log('✅ Using secure backend API (API key is server-side only)');
  
  if (!photoUrls || photoUrls.length === 0) {
    throw new Error('At least one photo URL is required');
  }

  try {
    // Call our secure backend API instead of OpenAI directly
    const response = await fetch('/api/detectFurniture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrls }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`;
      console.error('❌ Backend API error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const detections = data.detections || [];

    console.log('✅ Detection completed. Found', detections.length, 'items');

    // Process detections to ensure they have all required fields
    const processedDetections: Detection[] = detections.map((detection: any) => ({
      label: detection.label || 'Unknown Item',
      qty: detection.qty || 1,
      confidence: detection.confidence || 0.5,
      notes: detection.notes || '',
      room: detection.room || 'Other',
      size: detection.size || '',
      cubicFeet: detection.cubicFeet || estimateCubicFeet(detection.label || ''),
      weight: detection.weight || estimateWeight(detection.label || ''),
    }));

    const deduplicatedDetections = deduplicateDetections(processedDetections);
    const formattedDetections = formatDetectionsByRoom(deduplicatedDetections);

    return formattedDetections;

  } catch (error: any) {
    console.error('❌ Furniture detection failed:', error);
    throw new Error(`Failed to detect furniture: ${error.message}`);
  }
};

// Enhanced deduplication for maximum accuracy
const deduplicateDetections = (detections: Detection[]): Detection[] => {
  const seen = new Map<string, Detection>();
  let duplicatesFound = 0;

  detections.forEach(detection => {
    const normalizedLabel = normalizeLabel(detection.label);
    const canonicalRoomKey = getCanonicalRoomKey(detection.room);
    const key = `${canonicalRoomKey}:${normalizedLabel}`;

    if (!seen.has(key)) {
      // Store a clone so we don't mutate original references
      const clonedDetection: Detection = {
        ...detection,
        qty: detection.qty || 1,
        confidence: detection.confidence ?? 0.5,
      };
      seen.set(key, clonedDetection);
    } else {
      const existing = seen.get(key)!;
      const newQty = (existing.qty || 0) + (detection.qty || 1);
      console.log(`🔄 Merging duplicate: "${detection.label}" (${existing.qty} + ${detection.qty || 1} = ${newQty})`);
      existing.qty = newQty;
      existing.confidence = Math.max(existing.confidence ?? 0, detection.confidence ?? 0);
      duplicatesFound++;

      if (detection.notes && detection.notes !== existing.notes) {
        existing.notes = existing.notes ? `${existing.notes}; ${detection.notes}` : detection.notes;
      }
    }
  });

  console.log(`✅ Deduplication complete: ${seen.size} unique items, ${duplicatesFound} duplicates merged`);
  return Array.from(seen.values());
};

const normalizeLabel = (label?: string): string => {
  return (label || '')
    .toLowerCase()
    .replace(/\b(large|small|medium|big|little|tall|short|wide|narrow|standard)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getCanonicalRoomKey = (room?: string): string => {
  if (!room) return 'other';
  const lower = room.toLowerCase();

  if (lower.includes('living')) return 'living-room';
  if (lower.includes('dining')) return 'dining-room';
  if (lower.includes('kitchen')) return 'kitchen';
  if (lower.includes('bed')) return 'bedroom';
  if (lower.includes('bath')) return 'bathroom';
  if (lower.includes('office') || lower.includes('study')) return 'office';
  if (lower.includes('laundry') || lower.includes('utility')) return 'laundry';
  if (lower.includes('garage')) return 'garage';
  if (lower.includes('patio') || lower.includes('deck') || lower.includes('yard') || lower.includes('porch') || lower.includes('balcony')) return 'outdoor';
  if (lower.includes('entry') || lower.includes('foyer')) return 'entry';

  return lower.replace(/\s+/g, '-').trim() || 'other';
};

const hasBedroomDescriptor = (room?: string): boolean => {
  if (!room) return false;
  const lower = room.toLowerCase();

  if (!lower.includes('bed')) return false;
  if (/\d/.test(lower)) return true;

  const descriptorKeywords = ['primary', 'master', 'guest', 'nursery', 'kids', 'loft', 'suite', 'main'];
  return descriptorKeywords.some(keyword => lower.includes(keyword));
};

const toTitleCase = (value?: string): string => {
  if (!value) return 'Other';
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getRoomPriority = (room: string): number => {
  const lower = room.toLowerCase();

  if (lower.startsWith('entry') || lower.startsWith('foyer')) return 5;
  if (lower.startsWith('living')) return 10;
  if (lower.startsWith('family')) return 11;
  if (lower.startsWith('dining')) return 20;
  if (lower.startsWith('kitchen')) return 30;
  if (lower.startsWith('pantry')) return 35;
  if (lower.startsWith('bedroom')) {
    const match = lower.match(/(\d+)/);
    const index = match ? parseInt(match[1], 10) : 0;
    return 40 + index;
  }
  if (lower.includes('bath')) return 60;
  if (lower.includes('office') || lower.includes('study')) return 70;
  if (lower.includes('laundry') || lower.includes('utility')) return 80;
  if (lower.includes('garage')) return 90;
  if (lower.includes('patio') || lower.includes('deck') || lower.includes('yard') || lower.includes('porch') || lower.includes('balcony')) return 95;

  return 100;
};

const getDisplayRoomName = (originalRoom: string | undefined, canonicalKey: string): string => {
  const fallback = toTitleCase(originalRoom);

  switch (canonicalKey) {
    case 'living-room':
      return 'Living Room';
    case 'dining-room':
      return 'Dining Room';
    case 'kitchen':
      return 'Kitchen';
    case 'bathroom':
      return fallback.includes('Bath') ? fallback : 'Bathroom';
    case 'office':
      return 'Office';
    case 'laundry':
      return 'Laundry Room';
    case 'garage':
      return 'Garage';
    case 'outdoor':
      return 'Outdoor Space';
    case 'entry':
      return 'Entryway';
    default:
      return fallback;
  }
};

const formatDetectionsByRoom = (detections: Detection[]): Detection[] => {
  const bedroomCandidates = detections.filter(d => getCanonicalRoomKey(d.room) === 'bedroom' && !hasBedroomDescriptor(d.room));
  const shouldNumberBedrooms = bedroomCandidates.length > 1;

  let bedroomIndex = 0;

  const enrichedDetections = detections.map(detection => {
    const canonicalKey = getCanonicalRoomKey(detection.room);
    const clone: Detection = { ...detection };

    if (canonicalKey === 'bedroom') {
      if (hasBedroomDescriptor(detection.room)) {
        clone.room = toTitleCase(detection.room || 'Bedroom');
      } else if (shouldNumberBedrooms) {
        bedroomIndex += 1;
        clone.room = `Bedroom ${bedroomIndex}`;
      } else {
        clone.room = 'Bedroom';
      }
    } else {
      clone.room = getDisplayRoomName(detection.room, canonicalKey);
    }

    return clone;
  });

  return enrichedDetections.sort((a, b) => {
    const priorityDiff = getRoomPriority(a.room || '') - getRoomPriority(b.room || '');
    if (priorityDiff !== 0) return priorityDiff;
    return a.label.localeCompare(b.label);
  });
};
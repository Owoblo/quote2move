import { Detection } from '../types';
import { estimateCubicFeet, estimateWeight } from './cubicFeetEstimator';

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

    return processedDetections;

  } catch (error: any) {
    console.error('❌ Furniture detection failed:', error);
    throw new Error(`Failed to detect furniture: ${error.message}`);
  }
};

// Enhanced deduplication for maximum accuracy
const deduplicateDetections = (detections: Detection[]): Detection[] => {
  const deduplicated: Detection[] = [];
  const seen = new Map<string, Detection>();
  let duplicatesFound = 0;
  
  detections.forEach(detection => {
    // Create a sophisticated key that includes room and size context
    const normalizedLabel = detection.label.toLowerCase()
      .replace(/\b(large|small|big|little|tall|short|wide|narrow|standard|medium)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const key = `${normalizedLabel}-${detection.room}-${detection.sourcePhotoId}`;
    
    if (!seen.has(key)) {
      seen.set(key, detection);
      deduplicated.push(detection);
    } else {
      // Merge quantities for similar items in the same photo and room
      const existing = seen.get(key)!;
      console.log(`🔄 Merging duplicate: "${detection.label}" (${detection.qty} + ${existing.qty} = ${detection.qty + existing.qty})`);
      existing.qty += detection.qty;
      existing.confidence = Math.max(existing.confidence, detection.confidence);
      duplicatesFound++;
      
      // Update notes to include both descriptions
      if (detection.notes && detection.notes !== existing.notes) {
        existing.notes = `${existing.notes}; ${detection.notes}`;
      }
    }
  });
  
  console.log(`✅ Deduplication complete: ${deduplicated.length} unique items, ${duplicatesFound} duplicates merged`);
  return deduplicated;
};
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Interfaces matching src/types/index.ts where possible
interface Detection {
  label: string;
  qty: number;
  confidence: number;
  sourcePhotoId?: string; // Optional, logic handles this
  notes?: string;
  room?: string;
  size?: string;
  boxes?: number;
  cubicFeet?: number;
  weight?: number;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server environment
  const apiKey = process.env.OPENAI_API_KEY || process.env.VERCEL_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OpenAI API key not found in server environment');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')));
    return res.status(500).json({ 
      error: 'Server configuration error: OpenAI API key not configured.',
      hint: 'Please set OPENAI_API_KEY in your environment variables.'
    });
  }
  
  console.log('✅ OpenAI API key found');

  const { photoUrls } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return res.status(400).json({ error: 'photoUrls array is required' });
  }

  // Configuration
  const MAX_PHOTOS = 20;
  const BATCH_SIZE = 5;
  const PHOTO_TIMEOUT_MS = 45000;
  const MAX_RETRIES = 2;

  const photosToProcess = photoUrls.slice(0, MAX_PHOTOS);
  console.log(`📸 Processing ${photosToProcess.length} photos (limited from ${photoUrls.length})`);

  if (photosToProcess.length < photoUrls.length) {
    console.warn(`⚠️ Request limited to ${MAX_PHOTOS} photos to prevent timeout`);
  }

  const allDetections: Detection[] = [];
  
  // Process photos in batches
  for (let i = 0; i < photosToProcess.length; i += BATCH_SIZE) {
    const batch = photosToProcess.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} photos`);

    const batchPromises = batch.map(async (photoUrl: string) => {
      return processPhotoWithRetry(photoUrl, apiKey, MAX_RETRIES, PHOTO_TIMEOUT_MS);
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(detections => {
      if (Array.isArray(detections)) {
        allDetections.push(...detections);
      }
    });
  }

  // Deduplicate and merge detections
  const uniqueDetections = mergeDetections(allDetections);

  console.log(`✅ All processing complete: ${uniqueDetections.length} unique detections`);
  return res.status(200).json({ detections: uniqueDetections });
}

async function processPhotoWithRetry(
  photoUrl: string, 
  apiKey: string, 
  maxRetries: number, 
  timeoutMs: number
): Promise<Detection[]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 1000 * attempt; // Exponential-ish backoff
        console.log(`🔄 Retry ${attempt}/${maxRetries} for photo: ${photoUrl} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return await analyzePhoto(photoUrl, apiKey, timeoutMs);
    } catch (error: any) {
      const isRetryable = 
        error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.status === 429 || 
        (error.status >= 502 && error.status <= 504);

      if (attempt < maxRetries && isRetryable) {
        console.warn(`⚠️ Retryable error on attempt ${attempt + 1}:`, error.message);
        continue;
      }
      
      if (error.name === 'AbortError') {
         console.error(`⏱️ Timeout processing photo: ${photoUrl}`);
         return [];
      }

      console.error(`❌ Failed to process photo ${photoUrl}:`, error.message);
      return [];
    }
  }
  return [];
}

async function analyzePhoto(photoUrl: string, apiKey: string, timeoutMs: number): Promise<Detection[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: photoUrl, detail: 'auto' } }
          ]
        }],
        max_tokens: 2000,
        temperature: 0.1
      }),
      signal: controller.signal as any // Cast for node-fetch compatibility if needed
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      const error = new Error(`OpenAI API Error: ${response.status} ${JSON.stringify(errorData)}`);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return parseDetections(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseDetections(content: string): Detection[] {
  try {
    // Improved regex to handle markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || content.match(/(\[[\s\S]*?\])/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const detections = JSON.parse(jsonStr);
    return Array.isArray(detections) ? detections : [];
  } catch (error) {
    console.error('❌ JSON Parse Error:', error);
    return [];
  }
}

function mergeDetections(detections: Detection[]): Detection[] {
  return detections.reduce((acc: Detection[], detection) => {
    const existing = acc.find(
      d => d.label === detection.label && d.room === detection.room
    );
    if (existing) {
      existing.qty += detection.qty;
      existing.confidence = Math.max(existing.confidence, detection.confidence);
      // Sum cubic feet if available
      if (existing.cubicFeet && detection.cubicFeet) {
        existing.cubicFeet += detection.cubicFeet;
      }
    } else {
      acc.push({ ...detection });
    }
    return acc;
  }, []);
}

const SYSTEM_PROMPT = `You are a professional MOVING COMPANY inventory specialist. Analyze this real estate photo and identify ONLY items that professional movers can physically move and transport.

🚚 MOVER'S INVENTORY - ONLY DETECT MOVABLE ITEMS:

✅ MOVABLE FURNITURE & ITEMS (DETECT THESE):
- SEATING: Sofas, Sectionals, Loveseats, Recliners, Chairs (Dining, Office, Accent), Ottomans, Benches, Stools
- TABLES: Dining Tables, Coffee Tables, End Tables, Console Tables, Side Tables, Kitchen Islands (if freestanding)
- BEDS: King Beds, Queen Beds, Twin Beds, Bunk Beds, Daybeds, Futons, Mattresses, Box Springs
- STORAGE: Dressers, Chests of Drawers, Nightstands, Bookshelves, Freestanding Cabinets, Wardrobes, Armoires
- APPLIANCES: Refrigerators, Stoves, Ovens, Microwaves, Dishwashers, Washers, Dryers, Toasters, Coffee Makers
- ELECTRONICS: TVs, Monitors, Computers, Laptops, Sound Systems, Gaming Consoles, Speakers
- DECOR: Floor Lamps, Table Lamps, Mirrors (wall-mounted), Artwork, Plants, Vases, Clocks, Area Rugs
- KITCHEN: Freestanding Pantries, Wine Racks, Bar Stools, Kitchen Carts
- OUTDOOR: Patio Furniture, Grills, Outdoor Chairs/Tables

❌ DO NOT DETECT (FIXED INSTALLATIONS):
- Built-in cabinets, Built-in shelving, Built-in vanities
- Chandeliers, Ceiling fans, Light fixtures
- Built-in appliances (dishwashers, built-in ovens)
- Built-in bathroom vanities, Medicine cabinets
- Built-in wardrobes, Built-in closets
- Wall-mounted items (unless easily removable)
- Built-in countertops, Built-in islands
- Fixed mirrors, Built-in mirrors
- Built-in seating, Built-in benches

CRITICAL REQUIREMENTS:
1. COUNT EXACT QUANTITIES - If you see 4 dining chairs, write qty: 4
2. BE HIGHLY SPECIFIC - "Large Oak Dining Table", "Sectional Sofa with Ottoman", "King Size Platform Bed"
3. INCLUDE ROOM CONTEXT - "Master Bedroom Dresser", "Kitchen Island Stools", "Living Room Coffee Table"
4. DISTINGUISH SIMILAR ITEMS - "Coffee Table" vs "End Table" vs "Console Table"
5. SIZE DESCRIPTORS - CRITICAL FOR MOVERS:
   - TVs: Estimate screen size in inches (e.g., "40-50 inch TV", "55-65 inch TV", "70+ inch TV")
   - Furniture: Provide dimensions or size range when possible (e.g., "Large (7-8 ft)", "Small (4-5 ft)", "Queen Size", "King Size")
   - If exact size is unclear, provide a reasonable range (e.g., "Medium-Large", "30-40 inches wide")
6. ONLY MOVABLE ITEMS - Skip anything permanently attached or built-in

Return ONLY a valid JSON array with objects containing:
- label: VERY SPECIFIC movable furniture type with descriptors (string)
- qty: EXACT quantity visible (number)
- confidence: confidence score 0-1 (number)
- notes: room location and specific details (string)
- room: room type (string)
- size: size descriptor with specific measurements or ranges
- cubicFeet: **REQUIRED** - estimated cubic feet volume for this item (number)

Return ONLY a JSON array, no other text.`;

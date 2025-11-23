import type { VercelRequest, VercelResponse } from '@vercel/node';

// Phase 2: Per-Room Furniture Detection
// Detects furniture in a specific room with property context

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VERCEL_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error: OpenAI API key not configured.'
    });
  }

  const { roomName, roomPhotos, propertyContext } = req.body;

  if (!roomName || !roomPhotos || !Array.isArray(roomPhotos) || roomPhotos.length === 0) {
    return res.status(400).json({ error: 'roomName and roomPhotos array are required' });
  }

  const context = {
    bedrooms: propertyContext?.bedrooms || null,
    bathrooms: propertyContext?.bathrooms || null,
    sqft: propertyContext?.sqft || null,
    propertyType: propertyContext?.propertyType || 'SINGLE_FAMILY'
  };

  console.log(`📍 Detecting furniture in ${roomName} (${roomPhotos.length} photos)...`);

  try {
    const { detections, detectionTimeMs } = await detectFurnitureForRoom(roomName, roomPhotos, context, apiKey);

    console.log(`✅ ${roomName}: Found ${detections.length} items`);

    return res.status(200).json({
      detections,
      room: roomName,
      detectionTimeMs: detectionTimeMs
    });

  } catch (error: any) {
    console.error(`❌ Detection failed for ${roomName}:`, error);
    return res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
}

async function detectFurnitureForRoom(
  roomName: string,
  roomPhotos: string[],
  context: any,
  apiKey: string,
  maxRetries = 3
): Promise<{ detections: any[], detectionTimeMs: number }> {

  const isBedroomRoom = roomName.toLowerCase().includes('bedroom');
  const isBathroomRoom = roomName.toLowerCase().includes('bathroom');

  const contextText = `
PROPERTY CONTEXT:
${context.bedrooms ? `- Total Bedrooms: ${context.bedrooms}` : ''}
${context.bathrooms ? `- Total Bathrooms: ${context.bathrooms}` : ''}
${context.sqft ? `- Square Footage: ${context.sqft.toLocaleString()} sq ft` : ''}
${context.propertyType ? `- Property Type: ${context.propertyType}` : ''}

ROOM: ${roomName.replace(/_/g, ' ').toUpperCase()}
PHOTOS: ${roomPhotos.length} photo${roomPhotos.length > 1 ? 's showing this room from different angles' : ''}
`;

  const bedroomSpecificRules = isBedroomRoom ? `

🛏️ CRITICAL BEDROOM RULES:
1. **ONE BED PER BEDROOM** - Unless you clearly see bunk beds or multiple separate beds
2. If you see the same bed from different angles, COUNT IT ONLY ONCE
3. If you're uncertain about bed size (King vs Queen vs Twin), choose the MOST VISIBLE/CONFIDENT size
4. DO NOT list "King Bed" in one photo and "Queen Bed" in another - they're likely the same bed!
5. Typical bedroom has: 1 bed, 1-2 nightstands, 1 dresser, maybe 1 chair
6. If photos show different bed sizes, it's probably camera angle - pick ONE size
` : '';

  const bathroomSpecificRules = isBathroomRoom ? `

🚿 CRITICAL BATHROOM RULES:
1. DO NOT count built-in vanities, medicine cabinets, or built-in shelving
2. DO NOT count toilets, sinks, bathtubs, or showers (permanently installed)
3. ONLY count movable items like: hampers, storage carts, toilet paper holders (if freestanding)
` : '';

  const prompt = `You are a professional MOVING COMPANY inventory specialist analyzing a specific room.

${contextText}

⚠️ CRITICAL: These ${roomPhotos.length} photos show **THE EXACT SAME ROOM** from different camera angles.
DO NOT COUNT THE SAME ITEM MULTIPLE TIMES just because it appears in multiple photos!
${bedroomSpecificRules}${bathroomSpecificRules}

🚚 DETECT ONLY MOVABLE FURNITURE & ITEMS:

✅ MOVABLE ITEMS:
- SEATING: Sofas, Chairs, Ottomans, Benches, Recliners
- TABLES: Dining Tables, Coffee Tables, End Tables, Desks, Console Tables
- BEDS: Beds, Mattresses, Box Springs (ONE PER BEDROOM unless clearly multiple)
- STORAGE: Dressers, Nightstands, Bookshelves, Wardrobes, Chests
- APPLIANCES: Refrigerators, Stoves, Microwaves, Washers, Dryers (freestanding only)
- ELECTRONICS: TVs, Computers, Sound Systems, Gaming Consoles
- DECOR: Floor Lamps, Table Lamps, Area Rugs, Plants, Mirrors (if not built-in)

❌ DO NOT DETECT (FIXED/BUILT-IN):
- Built-in cabinets, Built-in shelving, Built-in appliances
- Chandeliers, Ceiling fans, Ceiling lights
- Built-in vanities, Medicine cabinets, Built-in mirrors
- Wall-mounted items (unless easily removable like wall art)
- Toilets, sinks, bathtubs, showers (bathrooms)
- Built-in countertops, built-in islands

REQUIREMENTS:
1. **COUNT EACH UNIQUE ITEM ONLY ONCE** (even if visible in 3 different photos!)
2. BE SPECIFIC: "Large L-Shaped Sectional Sofa", "Queen Size Platform Bed" (not "bed" + "bed" + "bed")
3. INCLUDE SIZE: "60 inch TV", "8-foot Dining Table", "Queen Bed"
4. ESTIMATE CUBIC FEET for moving trucks
5. If unsure between sizes (King vs Queen), pick the MOST CONFIDENT one

Return ONLY a valid JSON array:
[
  {
    "label": "Queen Size Platform Bed",
    "qty": 1,
    "confidence": 0.92,
    "notes": "Modern platform bed with headboard, appears to be queen size based on room proportions",
    "room": "${roomName}",
    "size": "Queen (60x80 inches)",
    "cubicFeet": 50
  }
]

Return ONLY valid JSON array, no other text.`;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff with jitter
        const delay = Math.min(2000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 30000);
        console.log(`🔄 Retry ${attempt}/${maxRetries} for ${roomName} detection after ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const startTime = performance.now();
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
              { type: 'text', text: prompt },
              ...roomPhotos.map((url: string) => ({
                type: 'image_url',
                image_url: { url, detail: 'high' }
              }))
            ]
          }],
          max_tokens: 2000,
          temperature: 0.05
        })
      });
      const endTime = performance.now();

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const status = response.status;
        
        // Only retry on rate limits (429) or server errors (5xx)
        if (status === 429 || status >= 500) {
          const errorMsg = `OpenAI API error: ${status} ${JSON.stringify(errorBody)}`;
          console.warn(errorMsg);
          throw new Error(errorMsg);
        }
        
        throw new Error(`OpenAI API error: ${status} ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const jsonMatch = content.match(/```(?:json)?\s*(\[.*?\])\s*```/s) || content.match(/(\[.*?\])/s);
      if (!jsonMatch) {
        console.warn(`Failed to parse JSON for room ${roomName}. Content: ${content.substring(0, 100)}...`);
        // If content exists but isn't valid JSON, this might be a model refusal or hallucination.
        // Treating as empty result to avoid breaking the flow.
        return { detections: [], detectionTimeMs: endTime - startTime };
      }
      
      const detections = JSON.parse(jsonMatch[1]);
      
      let processedDetections = Array.isArray(detections) ? detections : [];

      // Post-processing validation for bedrooms
      if (isBedroomRoom && Array.isArray(detections)) {
        const beds = detections.filter(d =>
          d.label.toLowerCase().includes('bed') &&
          !d.label.toLowerCase().includes('nightstand') &&
          !d.label.toLowerCase().includes('bedside')
        );

        if (beds.length > 1) {
          console.warn(`⚠️ Warning: ${beds.length} beds detected in ${roomName} - likely a mistake!`);
          
          // Keep only the bed with highest confidence
          const bestBed = beds.reduce((best, current) =>
            (current.confidence || 0) > (best.confidence || 0) ? current : best
          );

          // Remove all other beds
          processedDetections = detections.filter(d =>
            !beds.includes(d) || d === bestBed
          );

          console.log(`✅ Fixed: Kept only "${bestBed.label}" (confidence: ${bestBed.confidence})`);
        }
      }

      return {
        detections: processedDetections,
        detectionTimeMs: endTime - startTime
      };

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt + 1} failed for ${roomName}:`, error.message);
      
      if (!error.message.includes('429') && !error.message.includes('500') && !error.message.includes('502') && !error.message.includes('503') && !error.message.includes('504')) {
        break;
      }
    }
  }

  console.error(`❌ All retry attempts exhausted for ${roomName}.`);
  return { detections: [], detectionTimeMs: 0 };
}

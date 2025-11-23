import type { VercelRequest, VercelResponse } from '@vercel/node';

// 3-Phase Intelligent Furniture Detection System
// Phase 1: Room Classification
// Phase 2: Per-Room Detection with Property Context
// Phase 3: Validation & Anomaly Detection

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
    return res.status(500).json({
      error: 'Server configuration error: OpenAI API key not configured.',
      hint: 'Go to Vercel Dashboard → Settings → Environment Variables → Add OPENAI_API_KEY'
    });
  }

  const { photoUrls, propertyContext } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return res.status(400).json({ error: 'photoUrls array is required' });
  }

  // Property context (beds, baths, sqft from hdpdata)
  const context = {
    bedrooms: propertyContext?.bedrooms || null,
    bathrooms: propertyContext?.bathrooms || null,
    sqft: propertyContext?.sqft || null,
    propertyType: propertyContext?.propertyType || 'SINGLE_FAMILY'
  };

  console.log('🏠 Property Context:', context);
  console.log(`📸 Starting 3-Phase Detection for ${photoUrls.length} photos`);

  try {
    // ============================================
    // PHASE 1: ROOM CLASSIFICATION
    // ============================================
    console.log('\n🔵 PHASE 1: Classifying photos by room...');
    const roomClassification = await classifyPhotosByRoom(photoUrls, context, apiKey);
    console.log('✅ Phase 1 Complete:', Object.keys(roomClassification).length, 'rooms identified');
    console.log('Room breakdown:', Object.entries(roomClassification).map(([room, photos]) => `${room}: ${(photos as string[]).length} photos`).join(', '));

    // ============================================
    // PHASE 2: PER-ROOM DETECTION WITH CONTEXT
    // ============================================
    console.log('\n🟢 PHASE 2: Detecting furniture per room with context...');
    const allDetections: any[] = [];

    for (const [roomName, roomPhotos] of Object.entries(roomClassification)) {
      console.log(`\n📍 Processing ${roomName} (${(roomPhotos as string[]).length} photos)...`);

      const roomDetections = await detectFurnitureForRoom(
        roomName,
        roomPhotos as string[],
        context,
        apiKey
      );

      console.log(`✅ ${roomName}: Found ${roomDetections.length} items`);
      allDetections.push(...roomDetections);
    }

    console.log(`✅ Phase 2 Complete: ${allDetections.length} total items detected`);

    // ============================================
    // PHASE 3: VALIDATION & ANOMALY DETECTION
    // ============================================
    console.log('\n🟡 PHASE 3: Running validation...');
    const validation = validateDetections(allDetections, context);
    console.log('✅ Phase 3 Complete');

    if (validation.anomalies.length > 0) {
      console.log('⚠️ Anomalies detected:', validation.anomalies);
    } else {
      console.log('✅ No anomalies detected - inventory looks good!');
    }

    // Return results
    return res.status(200).json({
      detections: allDetections,
      validation: validation,
      metadata: {
        totalRooms: Object.keys(roomClassification).length,
        totalPhotos: photoUrls.length,
        propertyContext: context
      }
    });

  } catch (error: any) {
    console.error('❌ Detection failed:', error);
    return res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
}

// ============================================
// PHASE 1: ROOM CLASSIFICATION
// ============================================
async function classifyPhotosByRoom(
  photoUrls: string[],
  context: any,
  apiKey: string,
  maxRetries = 3
): Promise<Record<string, string[]>> {

  const prompt = `You are a real estate photo classifier. Analyze these ${photoUrls.length} property photos and classify each by room type.

PROPERTY CONTEXT:
${context.bedrooms ? `- ${context.bedrooms} bedrooms` : ''}
${context.bathrooms ? `- ${context.bathrooms} bathrooms` : ''}
${context.sqft ? `- ${context.sqft.toLocaleString()} square feet` : ''}
${context.propertyType ? `- Property Type: ${context.propertyType}` : ''}

INSTRUCTIONS:
1. Look at each photo and determine which room it shows
2. Use these room categories:
   - living_room, family_room, dining_room, kitchen
   - bedroom_1, bedroom_2, bedroom_3, etc. (based on property bedrooms)
   - bathroom_1, bathroom_2, etc. (based on property bathrooms)
   - office, laundry, garage, outdoor, entryway, other
3. If multiple photos show the same room from different angles, group them together
4. Number bedrooms and bathrooms sequentially

Return ONLY a JSON object mapping room names to arrays of photo indices:
{
  "living_room": [0, 3, 7],
  "kitchen": [1, 5],
  "bedroom_1": [2, 8, 9],
  "bedroom_2": [4, 11],
  "bathroom_1": [6],
  ...
}

Return ONLY valid JSON, no other text.`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 20000);
        console.log(`🔄 Retry ${attempt}/${maxRetries} for classification after ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

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
              ...photoUrls.map((url: string) => ({
                type: 'image_url',
                image_url: { url, detail: 'low' } // Use 'low' detail for classification (faster/cheaper)
              }))
            ]
          }],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
         const errorBody = await response.json().catch(() => ({}));
         const status = response.status;
         
         if (status === 429 || status >= 500) {
           const errorMsg = `OpenAI API error: ${status} ${JSON.stringify(errorBody)}`;
           console.warn(errorMsg);
           throw new Error(errorMsg);
         }
         throw new Error(`OpenAI API error: ${status} ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      // Parse JSON response
      const jsonMatch = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s) || content.match(/(\{.*?\})/s);
      const classification = JSON.parse(jsonMatch ? jsonMatch[1] : content);

      // Convert photo indices to URLs
      const roomClassification: Record<string, string[]> = {};
      for (const [room, indices] of Object.entries(classification)) {
        if (Array.isArray(indices)) {
          roomClassification[room] = indices.map((i: any) => photoUrls[i as number]).filter(Boolean);
        }
      }

      return roomClassification;

    } catch (error: any) {
      console.error(`❌ Classification attempt ${attempt + 1} failed:`, error.message);
      
      if (!error.message.includes('429') && !error.message.includes('500') && !error.message.includes('502') && !error.message.includes('503') && !error.message.includes('504')) {
        break;
      }
    }
  }
  
  console.error('❌ All retry attempts exhausted for classification.');
  // Fallback: treat all photos as one group
  return { 'all_rooms': photoUrls };
}

// ============================================
// PHASE 2: PER-ROOM DETECTION WITH CONTEXT
// ============================================
async function detectFurnitureForRoom(
  roomName: string,
  roomPhotos: string[],
  context: any,
  apiKey: string,
  maxRetries = 3
): Promise<any[]> {

  const contextText = `
PROPERTY CONTEXT:
${context.bedrooms ? `- Total Bedrooms: ${context.bedrooms}` : ''}
${context.bathrooms ? `- Total Bathrooms: ${context.bathrooms}` : ''}
${context.sqft ? `- Square Footage: ${context.sqft.toLocaleString()} sq ft` : ''}
${context.propertyType ? `- Property Type: ${context.propertyType}` : ''}

ROOM: ${roomName.replace(/_/g, ' ').toUpperCase()}
PHOTOS: ${roomPhotos.length} photo${roomPhotos.length > 1 ? 's showing this room from different angles' : ''}
`;

  const prompt = `You are a professional MOVING COMPANY inventory specialist analyzing a specific room.

${contextText}

CRITICAL: These ${roomPhotos.length} photos show THE SAME ROOM from different angles. DO NOT COUNT THE SAME ITEM MULTIPLE TIMES.

🚚 DETECT ONLY MOVABLE FURNITURE & ITEMS:

✅ MOVABLE ITEMS:
- SEATING: Sofas, Chairs, Ottomans, Benches
- TABLES: Dining Tables, Coffee Tables, End Tables, Desks
- BEDS: Beds, Mattresses, Box Springs (for bedrooms)
- STORAGE: Dressers, Nightstands, Bookshelves, Wardrobes
- APPLIANCES: Refrigerators, Stoves, Microwaves, Washers, Dryers
- ELECTRONICS: TVs, Computers, Sound Systems
- DECOR: Floor Lamps, Table Lamps, Area Rugs, Plants

❌ DO NOT DETECT (FIXED/BUILT-IN):
- Built-in cabinets, Built-in shelving, Built-in appliances
- Chandeliers, Ceiling fans, Light fixtures
- Built-in vanities, Medicine cabinets
- Wall-mounted items (unless easily removable)

REQUIREMENTS:
1. COUNT EACH UNIQUE ITEM ONLY ONCE (even if visible in multiple photos)
2. BE SPECIFIC: "Large L-Shaped Sectional Sofa", "Queen Size Platform Bed"
3. INCLUDE SIZE ESTIMATES: "60 inch TV", "8-foot Dining Table", "King Bed"
4. ESTIMATE CUBIC FEET for moving trucks

Return ONLY a valid JSON array:
[
  {
    "label": "Large L-Shaped Sectional Sofa",
    "qty": 1,
    "confidence": 0.95,
    "notes": "Gray fabric, appears to be 3-piece",
    "room": "${roomName}",
    "size": "Large (8-9 ft)",
    "cubicFeet": 80
  }
]

Return ONLY valid JSON array, no other text.`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 20000);
        console.log(`🔄 Retry ${attempt}/${maxRetries} for ${roomName} detection after ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

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
                image_url: { url, detail: 'high' } // Use 'high' detail for furniture detection
              }))
            ]
          }],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
         const errorBody = await response.json().catch(() => ({}));
         const status = response.status;
         
         if (status === 429 || status >= 500) {
           const errorMsg = `OpenAI API error: ${status} ${JSON.stringify(errorBody)}`;
           console.warn(errorMsg);
           throw new Error(errorMsg);
         }
         throw new Error(`OpenAI API error: ${status} ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      // Parse JSON response
      const jsonMatch = content.match(/```(?:json)?\s*(\[.*?\])\s*```/s) || content.match(/(\[.*?\])/s);
      
      if (!jsonMatch) {
         console.warn(`Failed to parse JSON for room ${roomName}. Content: ${content.substring(0, 100)}...`);
         return [];
      }

      const detections = JSON.parse(jsonMatch[1]);
      return Array.isArray(detections) ? detections : [];

    } catch (error: any) {
      console.error(`❌ Detection attempt ${attempt + 1} failed for ${roomName}:`, error.message);
      
      if (!error.message.includes('429') && !error.message.includes('500') && !error.message.includes('502') && !error.message.includes('503') && !error.message.includes('504')) {
        break;
      }
    }
  }

  console.error(`❌ All retry attempts exhausted for ${roomName}.`);
  return [];
}

// ============================================
// PHASE 3: VALIDATION & ANOMALY DETECTION
// ============================================
function validateDetections(detections: any[], context: any) {
  const validation: any = {
    anomalies: [],
    warnings: [],
    stats: {}
  };

  // Count beds
  const bedsDetected = detections.filter(d =>
    d.label.toLowerCase().includes('bed') &&
    !d.label.toLowerCase().includes('sofa') &&
    !d.label.toLowerCase().includes('couch')
  ).reduce((sum, d) => sum + (d.qty || 1), 0);

  validation.stats.bedsDetected = bedsDetected;
  validation.stats.expectedBedrooms = context.bedrooms;

  // Validate bed count
  if (context.bedrooms && bedsDetected > context.bedrooms + 1) {
    validation.anomalies.push(
      `⚠️ Detected ${bedsDetected} beds, but property has ${context.bedrooms} bedrooms. This seems high.`
    );
  } else if (context.bedrooms && bedsDetected < context.bedrooms - 1) {
    validation.warnings.push(
      `ℹ️ Detected ${bedsDetected} beds, but property has ${context.bedrooms} bedrooms. Some bedrooms may be unfurnished.`
    );
  }

  // Calculate total volume
  const totalCubicFeet = detections.reduce((sum, d) => sum + ((d.cubicFeet || 0) * (d.qty || 1)), 0);
  validation.stats.totalCubicFeet = totalCubicFeet;

  // Validate volume vs square footage
  if (context.sqft) {
    const expectedMinVolume = context.sqft * 0.15; // 15% of sqft (lightly furnished)
    const expectedMaxVolume = context.sqft * 0.50; // 50% of sqft (heavily furnished)

    validation.stats.expectedVolumeRange = `${Math.round(expectedMinVolume)}-${Math.round(expectedMaxVolume)} cu ft`;

    if (totalCubicFeet > expectedMaxVolume * 1.5) {
      validation.anomalies.push(
        `⚠️ Total volume (${Math.round(totalCubicFeet)} cu ft) seems very high for a ${context.sqft} sq ft property. Please review counts.`
      );
    }
  }

  // Check for duplicate items in same room
  const roomItemCounts: Record<string, Record<string, number>> = {};
  detections.forEach(d => {
    const room = d.room || 'unknown';
    const label = d.label.toLowerCase();

    if (!roomItemCounts[room]) {
      roomItemCounts[room] = {};
    }

    roomItemCounts[room][label] = (roomItemCounts[room][label] || 0) + (d.qty || 1);
  });

  // Flag suspicious duplicates
  Object.entries(roomItemCounts).forEach(([room, items]) => {
    Object.entries(items).forEach(([item, count]) => {
      if (item.includes('refrigerator') && count > 2) {
        validation.anomalies.push(`⚠️ ${count} refrigerators detected in ${room} - possible duplicate`);
      }
      if (item.includes('stove') && count > 2) {
        validation.anomalies.push(`⚠️ ${count} stoves detected in ${room} - possible duplicate`);
      }
    });
  });

  return validation;
}

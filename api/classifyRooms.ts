import type { VercelRequest, VercelResponse } from '@vercel/node';

// Phase 1 ONLY: Room Classification
// Returns room names and which photos belong to each room

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VERCEL_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OpenAI API key not found');
    return res.status(500).json({
      error: 'Server configuration error: OpenAI API key not configured.'
    });
  }

  const { photoUrls, propertyContext } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return res.status(400).json({ error: 'photoUrls array is required' });
  }

  const context = {
    bedrooms: propertyContext?.bedrooms || null,
    bathrooms: propertyContext?.bathrooms || null,
    sqft: propertyContext?.sqft || null,
    propertyType: propertyContext?.propertyType || 'SINGLE_FAMILY'
  };

  console.log('🏠 Property Context:', context);
  console.log(`📸 Classifying ${photoUrls.length} photos by room...`);

  try {
    const { rooms, detectionTimeMs } = await classifyPhotosByRoom(photoUrls, context, apiKey);

    console.log('✅ Room Classification Complete');
    console.log('Rooms:', Object.keys(rooms));

    return res.status(200).json({
      rooms: rooms,
      metadata: {
        totalRooms: Object.keys(rooms).length,
        totalPhotos: photoUrls.length,
        propertyContext: context,
        detectionTimeMs: detectionTimeMs
      }
    });

  } catch (error: any) {
    console.error('❌ Room classification failed:', error);
    return res.status(500).json({
      error: 'Room classification failed',
      message: error.message
    });
  }
}

async function classifyPhotosByRoom(
  photoUrls: string[],
  context: any,
  apiKey: string
): Promise<Record<string, any>> {

  const BATCH_SIZE = 5; // Very conservative batch size for 30k TPM (tokens per minute) limit
  const RETRY_ATTEMPTS = 3;
  const BASE_DELAY = 3000; // 3 seconds base delay

  // If photos fit in one batch, use the original logic
  if (photoUrls.length <= BATCH_SIZE) {
    return classifySingleBatch(photoUrls, context, apiKey, RETRY_ATTEMPTS, BASE_DELAY);
  }

  // Otherwise, process in batches
  console.log(`📦 Batching ${photoUrls.length} photos into groups of ${BATCH_SIZE}...`);

  const batches: string[][] = [];
  for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
    batches.push(photoUrls.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Created ${batches.length} batches`);

  const allRoomClassifications: Record<string, number[]> = {};
  let totalTime = 0;
  let knownRooms: string[] = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchOffset = batchIndex * BATCH_SIZE;

    console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} photos)...`);

    try {
      const { rooms, detectionTimeMs } = await classifySingleBatch(
        batch,
        context,
        apiKey,
        RETRY_ATTEMPTS,
        BASE_DELAY,
        knownRooms,
        batchOffset
      );

      totalTime += detectionTimeMs;

      // Merge batch results into overall classification
      for (const [room, indices] of Object.entries(rooms)) {
        if (!allRoomClassifications[room]) {
          allRoomClassifications[room] = [];
          knownRooms.push(room);
        }
        allRoomClassifications[room].push(...(indices as number[]));
      }

      // Delay between batches to avoid TPM rate limiting (30k tokens/minute)
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error: any) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
      // Continue with next batch instead of failing completely
    }
  }

  // Convert photo indices to URLs
  const roomClassification: Record<string, string[]> = {};
  for (const [room, indices] of Object.entries(allRoomClassifications)) {
    roomClassification[room] = indices.map(i => photoUrls[i]);
  }

  // Fallback if no rooms were classified
  if (Object.keys(roomClassification).length === 0) {
    console.error('⚠️ FALLING BACK: Treating all photos as one group to prevent total failure');
    return {
      rooms: { 'all_rooms': photoUrls },
      detectionTimeMs: totalTime
    };
  }

  return {
    rooms: roomClassification,
    detectionTimeMs: totalTime
  };
}

async function classifySingleBatch(
  photoUrls: string[],
  context: any,
  apiKey: string,
  maxRetries: number,
  baseDelay: number,
  knownRooms: string[] = [],
  batchOffset: number = 0
): Promise<{ rooms: Record<string, number[]>, detectionTimeMs: number }> {

  const knownRoomsText = knownRooms.length > 0
    ? `\n\nKNOWN ROOMS FROM PREVIOUS PHOTOS:\n${knownRooms.join(', ')}\n⚠️ IMPORTANT: If any photos in this batch show the same rooms as above, USE THE SAME ROOM NAMES!`
    : '';

  const prompt = `You are a real estate photo classifier. Analyze these ${photoUrls.length} property photos and classify each by room type.

PROPERTY CONTEXT:
${context.bedrooms ? `- ${context.bedrooms} bedrooms` : ''}
${context.bathrooms ? `- ${context.bathrooms} bathrooms` : ''}
${context.sqft ? `- ${context.sqft.toLocaleString()} square feet` : ''}
${context.propertyType ? `- Property Type: ${context.propertyType}` : ''}${knownRoomsText}

INSTRUCTIONS:
1. Look at each photo and determine which room it shows
2. Use these room categories:
   - living_room, family_room, dining_room, kitchen
   - bedroom_1, bedroom_2, bedroom_3, etc. (based on property bedrooms)
   - bathroom_1, bathroom_2, etc. (based on property bathrooms)
   - office, laundry, garage, outdoor, entryway, hallway, other
3. If multiple photos show the same room from different angles, group them together
4. Number bedrooms and bathrooms sequentially
5. IMPORTANT: If you see ${context.bedrooms || 'multiple'} bedrooms, create exactly ${context.bedrooms || 'that many'} bedroom categories

Return ONLY a JSON object mapping room names to arrays of photo indices (0-${photoUrls.length - 1} for this batch):
{
  "living_room": [0, 3, 7],
  "kitchen": [1, 5],
  "bedroom_1": [2, 8, 9],
  "bedroom_2": [4, 11],
  "bathroom_1": [6],
  ...
}

Return ONLY valid JSON, no other text.`;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`✅ OpenAI API key found`);
      console.log(`🔑 Key prefix: ${apiKey.substring(0, 20)}...`);

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
              ...photoUrls.map((url: string) => ({
                type: 'image_url',
                image_url: { url, detail: 'low' }
              }))
            ]
          }],
          max_tokens: 1000,
          temperature: 0.1
        })
      });
      const endTime = performance.now();

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenAI API error: ${response.status} ${errorBody}`;
        console.warn(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      const jsonMatch = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s) || content.match(/(\{.*?\})/s);
      const classification = JSON.parse(jsonMatch ? jsonMatch[1] : content);

      // Adjust indices to account for batch offset
      const adjustedClassification: Record<string, number[]> = {};
      for (const [room, indices] of Object.entries(classification)) {
        adjustedClassification[room] = (indices as number[]).map(i => i + batchOffset);
      }

      return {
        rooms: adjustedClassification,
        detectionTimeMs: endTime - startTime
      };

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed: ${error.message}`);
      console.error('Full error:', error);

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retry ${attempt}/${maxRetries} for classification after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ All retry attempts exhausted for classification.`);
        console.error(`❌ Last error was: ${error.message}`);
      }
    }
  }

  throw lastError;
}

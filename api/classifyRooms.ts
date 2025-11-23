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
  apiKey: string,
  maxRetries = 3
): Promise<{ rooms: Record<string, any>, detectionTimeMs: number }> {

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
   - office, laundry, garage, outdoor, entryway, hallway, other
3. If multiple photos show the same room from different angles, group them together
4. Number bedrooms and bathrooms sequentially
5. IMPORTANT: If you see ${context.bedrooms || 'multiple'} bedrooms, create exactly ${context.bedrooms || 'that many'} bedroom categories

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

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff with jitter: 2s, 4s, 8s... + random jitter
        const delay = Math.min(2000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 30000);
        console.log(`🔄 Retry ${attempt}/${maxRetries} for classification after ${Math.round(delay)}ms...`);
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

      const jsonMatch = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s) || content.match(/(\{.*?\})/s);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from OpenAI response');
      }
      
      const classification = JSON.parse(jsonMatch[1]);

      // Convert photo indices to URLs
      const roomClassification: Record<string, string[]> = {};
      for (const [room, indices] of Object.entries(classification)) {
        if (Array.isArray(indices)) {
          roomClassification[room] = indices.map((i: any) => photoUrls[i as number]).filter(Boolean);
        }
      }

      return {
        rooms: roomClassification,
        detectionTimeMs: endTime - startTime
      };

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry if it's not a rate limit or server error
      if (!error.message.includes('429') && !error.message.includes('500') && !error.message.includes('502') && !error.message.includes('503') && !error.message.includes('504')) {
        break; 
      }
    }
  }

  console.error('❌ All retry attempts exhausted for classification.');
  // Fallback: treat all photos as one group to prevent total failure
  return { 
    rooms: { 'all_rooms': photoUrls },
    detectionTimeMs: 0
  };
}

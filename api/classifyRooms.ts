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

  try {
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    const jsonMatch = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s) || content.match(/(\{.*?\})/s);
    const classification = JSON.parse(jsonMatch ? jsonMatch[1] : content);

    // Convert photo indices to URLs
    const roomClassification: Record<string, string[]> = {};
    for (const [room, indices] of Object.entries(classification)) {
      roomClassification[room] = (indices as number[]).map(i => photoUrls[i]);
    }

    return {
      rooms: roomClassification,
      detectionTimeMs: endTime - startTime
    };

  } catch (error: any) {
    console.error('❌ Room classification failed:', error);
    // Fallback: treat all photos as one group
    return { 
      rooms: { 'all_rooms': photoUrls },
      detectionTimeMs: 0
    };
  }
}

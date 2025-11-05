import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server environment (never exposed to browser)
  // Try multiple possible env variable names
  const apiKey = process.env.OPENAI_API_KEY || process.env.VERCEL_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OpenAI API key not found in server environment');
    console.error('Checked: OPENAI_API_KEY, VERCEL_OPENAI_API_KEY, REACT_APP_OPENAI_API_KEY');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')));
    return res.status(500).json({ 
      error: 'Server configuration error: OpenAI API key not configured. Please set OPENAI_API_KEY in Vercel environment variables.',
      hint: 'Go to Vercel Dashboard → Settings → Environment Variables → Add OPENAI_API_KEY'
    });
  }
  
  console.log('✅ OpenAI API key found (length:', apiKey.length, ', starts with:', apiKey.substring(0, 7) + '...)');

  const { photoUrls } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return res.status(400).json({ error: 'photoUrls array is required' });
  }

  // Limit photos to prevent timeout (max 20 photos, process in parallel batches)
  const maxPhotos = 20;
  const photosToProcess = photoUrls.slice(0, maxPhotos);
  const batchSize = 5; // Process 5 photos in parallel at a time
  const photoTimeout = 45000; // 45 seconds per photo max

  console.log(`📸 Processing ${photosToProcess.length} photos (limited from ${photoUrls.length}) in batches of ${batchSize}`);

  if (photosToProcess.length < photoUrls.length) {
    console.log(`⚠️ Limited to ${maxPhotos} photos to prevent timeout`);
  }

  // Process photos in parallel batches to speed up processing
  const allDetections: any[] = [];
  
  // Process photos in batches
  for (let i = 0; i < photosToProcess.length; i += batchSize) {
    const batch = photosToProcess.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} photos`);

    // Process batch in parallel with timeout
    const batchPromises = batch.map(async (photoUrl: string) => {
      const maxRetries = 2;
      let lastError: any = null;

      // Retry logic for transient errors (502, 503, 504, 429)
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`🔄 Retry ${attempt}/${maxRetries} for photo:`, photoUrl);
            // Exponential backoff: 1s, 2s
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          } else {
            console.log('🔍 Server: Analyzing photo:', photoUrl);
          }

          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Photo processing timeout')), photoTimeout)
          );

          // Race between API call and timeout
          const response = await Promise.race([
            fetch('https://api.openai.com/v1/chat/completions', {
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
                  {
                    type: 'text',
                    text: `You are a professional MOVING COMPANY inventory specialist. Analyze this real estate photo and identify ONLY items that professional movers can physically move and transport.

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

Return ONLY a JSON array, no other text.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: photoUrl,
                      detail: 'high'
                    }
                  }
                ]
              }],
              max_tokens: 2000,
              temperature: 0.1
            })
          }),
                        timeoutPromise as Promise<Response>
            ]) as Response;

          // Handle retryable errors (502, 503, 504, 429)
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const status = response.status;
            
            // Retry on transient errors
            if ((status === 502 || status === 503 || status === 504 || status === 429) && attempt < maxRetries) {
              lastError = { status, errorData };
              console.warn(`⚠️ Retryable error ${status} on attempt ${attempt + 1}/${maxRetries + 1}`);
              continue; // Retry
            }
            
            // Non-retryable error or max retries reached
            console.error('❌ OpenAI API Error:', status, errorData);
            return [];
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content;

          if (!content) {
            console.error('❌ No content in OpenAI response');
            return [];
          }

          // Parse JSON from response
          let detections;
          try {
            const jsonMatch = content.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
            detections = JSON.parse(jsonMatch ? jsonMatch[1] : content);
          } catch (parseError) {
            console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
            return [];
          }

          return Array.isArray(detections) ? detections : [];

        } catch (error: any) {
          lastError = error;
          
          // Don't retry on timeout - it's likely a real issue
          if (error.message === 'Photo processing timeout') {
            console.error('⏱️ Timeout processing photo:', photoUrl);
            return [];
          }
          
          // Retry on network errors if we have retries left
          if (attempt < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
            console.warn(`⚠️ Network error on attempt ${attempt + 1}/${maxRetries + 1}, will retry`);
            continue;
          }
          
          // Final error - no more retries
          console.error('❌ Error processing photo:', photoUrl, error.message);
          return [];
        }
      }

      // If we get here, all retries failed
      console.error('❌ All retries exhausted for photo:', photoUrl, lastError?.message || '');
      return [];
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Flatten batch results
    batchResults.forEach(detections => {
      if (Array.isArray(detections) && detections.length > 0) {
        allDetections.push(...detections);
      }
    });

    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed: ${batchResults.flat().length} detections`);
  }

  // Deduplicate detections (same logic as before)
  const uniqueDetections = allDetections.reduce((acc: any[], detection: any) => {
    const existing = acc.find(
      (d: any) => d.label === detection.label && d.room === detection.room
    );
    if (existing) {
      existing.qty += detection.qty;
      existing.confidence = Math.max(existing.confidence, detection.confidence);
    } else {
      acc.push(detection);
    }
    return acc;
  }, []);

  console.log(`✅ All processing complete: ${uniqueDetections.length} unique detections from ${photosToProcess.length} photos`);

  return res.status(200).json({ detections: uniqueDetections });
}

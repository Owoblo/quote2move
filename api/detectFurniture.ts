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
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in server environment');
    return res.status(500).json({ 
      error: 'Server configuration error: OpenAI API key not configured' 
    });
  }

  const { photoUrls } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return res.status(400).json({ error: 'photoUrls array is required' });
  }

  // Process each photo
  const allDetections: any[] = [];

  for (const photoUrl of photoUrls) {
    try {
      console.log('🔍 Server: Analyzing photo:', photoUrl);

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
   - TVs: Estimate screen size in inches (e.g., "40-50 inch TV", "55-65 inch TV", "70+ inch TV"). If unsure, provide a reasonable range based on visual scale compared to furniture nearby.
   - Furniture: Provide dimensions or size range when possible (e.g., "Large (7-8 ft)", "Small (4-5 ft)", "Queen Size", "King Size"). Estimate based on visual scale or standard sizes.
   - If exact size is unclear, provide a reasonable range (e.g., "Medium-Large", "30-40 inches wide")
6. ONLY MOVABLE ITEMS - Skip anything permanently attached or built-in

Return ONLY a valid JSON array with objects containing:
- label: VERY SPECIFIC movable furniture type with descriptors (string)
- qty: EXACT quantity visible (number) 
- confidence: confidence score 0-1 (number)
- notes: room location and specific details (string)
- room: room type (string)
- size: size descriptor with specific measurements or ranges - CRITICAL for TVs: estimate inches (e.g., "55-inch", "65-75 inch range"). For furniture: dimensions or size category with ranges (e.g., "Large (7-8 ft)", "Queen Size", "30-40 inches wide")
- cubicFeet: **REQUIRED** - estimated cubic feet volume for this item (number). ALWAYS provide this field using standard moving industry estimates. Examples:
  * Sofa (3-cushion): 35 cu ft
  * Loveseat: 30 cu ft
  * Dining chair: 5 cu ft
  * Dining table (4-6 seater): 30 cu ft
  * Queen bed: 65 cu ft
  * King bed: 70 cu ft
  * Dresser (medium): 40 cu ft
  * TV 55": 45 cu ft
  * TV 60"+: 55 cu ft
  * Refrigerator: 35 cu ft
  * Washer/Dryer: 25 cu ft each
  * Piano (upright): 70 cu ft
  * Pool table: 40 cu ft
  * For items not listed, estimate based on dimensions and industry standards
- weight: **REQUIRED** - estimated weight in pounds (number). ALWAYS provide this field using Saturn Star Movers cube sheet standards:
  * 3-cushion sofa: 245 lbs
  * Loveseat: 210 lbs
  * Armchair: 105 lbs
  * Dining chair: 35 lbs
  * Dining table: 210 lbs
  * Coffee table: 84 lbs
  * End table: 35 lbs
  * Queen bed: 455 lbs
  * King bed: 490 lbs
  * Dresser (medium): 280 lbs
  * Dresser (large 8+): 350 lbs
  * TV 40-49": 280 lbs
  * TV 50-59": 315 lbs
  * TV 60"+: 385 lbs
  * Refrigerator (≤6 cu ft): 210 lbs
  * Refrigerator (7-10 cu ft): 315 lbs
  * Washer/Dryer: 175 lbs each
  * Microwave: 70 lbs
  * Upright piano: 490 lbs
  * Baby grand piano: 560 lbs
  * Pool table: 280 lbs
  * Box (medium): 21 lbs
  * Box (large): 42 lbs
  * For other items: use ~7 lbs per cubic foot as rule of thumb

Remember: Only detect items that professional movers can physically pick up and transport. Skip built-in, fixed, or permanently installed items.

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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenAI API Error:', response.status, errorData);
        continue; // Skip this photo and continue with next
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        console.error('❌ No content in OpenAI response');
        continue;
      }

      // Parse JSON from response
      let detections;
      try {
        // Try to extract JSON if wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
        detections = JSON.parse(jsonMatch ? jsonMatch[1] : content);
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
        console.error('Response content:', content);
        continue;
      }

      if (Array.isArray(detections)) {
        allDetections.push(...detections);
      }

    } catch (error: any) {
      console.error('❌ Error processing photo:', photoUrl, error.message);
      // Continue with next photo
    }
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

  return res.status(200).json({ detections: uniqueDetections });
}

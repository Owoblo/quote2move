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
  const errorDetails: string[] = [];

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

          const systemPrompt = `You are MovSense's AI inventory estimator. Extract ONLY movable items that professional movers handle. Return precise quantities, descriptive labels, room, size descriptors, confidence, and cubic feet estimates. Do not include built-ins or immovable fixtures.`;
          const userPrompt = `Analyze this real estate photo and return the inventory JSON that matches the schema. Focus on movable furniture, appliances, electronics, decor, outdoor furniture, and boxes. Include size descriptors (dimensions or ranges) and room context.`;

          const responseFormat = {
            type: 'json_schema',
            json_schema: {
              name: 'furniture_detection',
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        label: { type: 'string' },
                        qty: { type: 'integer', minimum: 1 },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        notes: { type: 'string' },
                        room: { type: 'string' },
                        size: { type: 'string' },
                        cubicFeet: { type: 'number', minimum: 0 }
                      },
                      required: ['label', 'qty', 'confidence', 'room', 'cubicFeet']
                    }
                  }
                },
                required: ['items']
              }
            }
          };

          const requestPayload = {
            model: 'gpt-4o-mini',
            input: [
              {
                role: 'system',
                content: [{ type: 'text', text: systemPrompt }]
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: photoUrl,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            temperature: 0.15,
            max_output_tokens: 1800,
            response_format: responseFormat
          };

          // Race between API call and timeout
          const response = await Promise.race([
            fetch('https://api.openai.com/v1/responses', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestPayload)
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
            errorDetails.push(`OpenAI API error ${status}: ${JSON.stringify(errorData)}`);
            return { detections: [], rawContent: undefined };
          }

          const data = await response.json();

          const extractDetections = (payload: any): any[] => {
            if (!payload) return [];

            const tryParseText = (raw: string | undefined): any[] => {
              if (!raw) return [];
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
                if (Array.isArray(parsed?.items)) return parsed.items;
              } catch (parseError) {
                errorDetails.push(`Failed to parse OpenAI text response: ${(parseError as Error).message}`);
              }
              return [];
            };

            // Prefer structured json content when using json schema
            if (Array.isArray(payload.output)) {
              for (const block of payload.output) {
                if (Array.isArray(block?.content)) {
                  for (const contentItem of block.content) {
                    if (contentItem?.type === 'json' && contentItem.json) {
                      if (Array.isArray(contentItem.json)) {
                        return contentItem.json;
                      }
                      if (Array.isArray(contentItem.json?.items)) {
                        return contentItem.json.items;
                      }
                    } else if (contentItem?.type === 'output_text' || contentItem?.type === 'text') {
                      const parsed = tryParseText(contentItem.text);
                      if (parsed.length > 0) return parsed;
                    }
                  }
                }
              }
            }

            if (typeof payload.output_text === 'string') {
              const parsed = tryParseText(payload.output_text);
              if (parsed.length > 0) return parsed;
            }

            return [];
          };

          const detections = extractDetections(data);

          if (detections.length === 0) {
            errorDetails.push(`OpenAI returned no items for photo: ${photoUrl.substring(0, 120)}`);
          }

          if (errorDetails.length < 5) {
            errorDetails.push(`OpenAI raw payload snippet: ${JSON.stringify(data).slice(0, 180)}...`);
          }

          return { detections, rawContent: JSON.stringify(data).slice(0, 500) };

        } catch (error: any) {
          lastError = error;
          
          // Don't retry on timeout - it's likely a real issue
          if (error.message === 'Photo processing timeout') {
            console.error('⏱️ Timeout processing photo:', photoUrl);
            errorDetails.push(`Timeout processing photo: ${photoUrl}`);
            return { detections: [], rawContent: undefined };
          }
          
          // Retry on network errors if we have retries left
          if (attempt < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
            console.warn(`⚠️ Network error on attempt ${attempt + 1}/${maxRetries + 1}, will retry`);
            continue;
          }
          
          // Final error - no more retries
          console.error('❌ Error processing photo:', photoUrl, error.message);
            errorDetails.push(`Error processing photo ${photoUrl}: ${error.message}`);
          return [];
        }
      }

      // If we get here, all retries failed
      console.error('❌ All retries exhausted for photo:', photoUrl, lastError?.message || '');
      if (lastError?.message) {
        errorDetails.push(`All retries exhausted for ${photoUrl}: ${lastError.message}`);
      } else {
        errorDetails.push(`All retries exhausted for ${photoUrl}`);
      }
      return { detections: [], rawContent: undefined };
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Flatten batch results
    batchResults.forEach(result => {
      if (result && Array.isArray((result as any).detections) && (result as any).detections.length > 0) {
        allDetections.push(...(result as any).detections);
      }
      if (result && typeof (result as any).rawContent === 'string') {
        errorDetails.push(`OpenAI raw content: ${(result as any).rawContent.slice(0, 180)}`);
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

  if (uniqueDetections.length === 0 && errorDetails.length > 0) {
    return res.status(502).json({
      error: 'AI detection failed',
      details: errorDetails.slice(0, 10),
    });
  }

  const payload: Record<string, any> = { detections: uniqueDetections, debug: errorDetails.slice(0, 10) };

  return res.status(200).json(payload);
}

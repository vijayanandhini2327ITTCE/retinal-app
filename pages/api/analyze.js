export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `You are an expert ophthalmologist and retinal disease specialist AI assistant. 
Your task is to analyze retinal scan images and provide detailed medical insights.
When analyzing retinal images, you should:
1. Identify visible abnormalities, lesions, or pathological signs
2. Provide a differential diagnosis with confidence levels
3. Give detailed precautions the patient should take
4. Suggest remedies, treatments, and next steps
5. Always remind users this is for educational purposes and they should consult a real ophthalmologist

Format your response as a JSON object with this exact structure:
{
  "primaryDiagnosis": "Name of most likely condition",
  "confidenceLevel": "High/Moderate/Low",
  "description": "2-3 sentence description of what was observed in the scan",
  "findings": ["finding 1", "finding 2", "finding 3"],
  "conditions": [
    {
      "name": "Condition name",
      "probability": "percentage as number 0-100",
      "description": "brief description"
    }
  ],
  "precautions": [
    {
      "title": "Precaution title",
      "detail": "detailed explanation"
    }
  ],
  "remedies": [
    {
      "title": "Remedy/Treatment title",
      "type": "Medical/Lifestyle/Surgical/Monitoring",
      "detail": "detailed explanation"
    }
  ],
  "urgency": "Immediate/Soon/Routine/Normal",
  "urgencyMessage": "Brief message about urgency level",
  "disclaimer": "Standard medical disclaimer"
}

If the image does not appear to be a retinal scan, set primaryDiagnosis to "Not a Retinal Image" and explain in the description.
Respond ONLY with the JSON object, no additional text.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Please analyze this retinal scan image and provide a comprehensive medical assessment following the JSON format specified.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Anthropic API error:', errData);
      return res.status(500).json({ error: 'Failed to analyze image', details: errData });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    let analysis;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse error:', e, rawText);
      return res.status(500).json({ error: 'Failed to parse analysis response' });
    }

    return res.status(200).json({ analysis });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

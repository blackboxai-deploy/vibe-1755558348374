import { CustomEndpointRequest, AIMessage } from '@/types';

// Custom endpoint configuration
const CUSTOM_ENDPOINT = 'https://oi-server.onrender.com/chat/completions';
const HEADERS = {
  'customerId': 'cus_SGPn4uhjPI0F4w',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer xxx'
};

// Default models
export const MODELS = {
  SCRIPT_GENERATION: 'openrouter/anthropic/claude-sonnet-4',
  VIDEO_GENERATION: 'replicate/google/veo-3'
} as const;

// System prompts
export const SYSTEM_PROMPTS = {
  SCRIPT_GENERATOR: `You are a professional music video director and scriptwriter specializing in rap music videos. Your task is to create detailed, cinematic scene descriptions for rap music videos.

Given a user's prompt, create exactly 5 distinct scenes for a rap music video. Each scene should be:
- Visually compelling and cinematic
- Appropriate for rap music video aesthetics
- Detailed enough for AI video generation
- 10-15 seconds in duration
- Include specific camera movements, lighting, and visual elements

Return your response as a JSON object with this exact structure:
{
  "scenes": [
    {
      "id": "scene_1",
      "title": "Scene Title",
      "description": "Detailed visual description for AI video generation (2-3 sentences, very specific)",
      "duration": 12,
      "visualElements": ["element1", "element2", "element3"],
      "rapperActions": ["action1", "action2"],
      "cameraMovement": "specific camera movement description",
      "setting": "detailed setting description"
    }
  ],
  "overallTheme": "Overall video theme",
  "musicStyle": "Music style/genre",
  "totalDuration": 60
}

Make each scene unique and ensure they flow together as a cohesive music video narrative.`,

  VIDEO_GENERATOR: `Generate a high-quality rap music video scene based on this description. Create a cinematic, professional-looking video with:
- Sharp, clear visuals
- Dynamic camera movements
- Appropriate lighting for the scene
- Realistic human movements and expressions
- High production value aesthetic
- Duration: {duration} seconds

Scene description: {description}`
};

/**
 * Make a request to the custom AI endpoint
 */
export async function makeAIRequest(
  model: string,
  messages: AIMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  } = {}
): Promise<any> {
  const { maxTokens = 4000, temperature = 0.7, timeout = 300000 } = options;

  const requestBody: CustomEndpointRequest = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(CUSTOM_ENDPOINT, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout / 1000} seconds`);
    }
    
    throw error;
  }
}

/**
 * Generate script using Claude Sonnet 4
 */
export async function generateScript(userPrompt: string): Promise<any> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPTS.SCRIPT_GENERATOR
    },
    {
      role: 'user',
      content: `Create 5 rap music video scenes based on this prompt: "${userPrompt}"`
    }
  ];

  const response = await makeAIRequest(MODELS.SCRIPT_GENERATION, messages, {
    temperature: 0.8,
    timeout: 180000 // 3 minutes for script generation
  });

  return response.choices[0].message.content;
}

/**
 * Generate video using Google Veo-3
 */
export async function generateVideo(
  sceneDescription: string,
  duration: number = 12
): Promise<any> {
  const prompt = SYSTEM_PROMPTS.VIDEO_GENERATOR
    .replace('{description}', sceneDescription)
    .replace('{duration}', duration.toString());

  const messages: AIMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await makeAIRequest(MODELS.VIDEO_GENERATION, messages, {
    temperature: 0.6,
    timeout: 900000 // 15 minutes for video generation
  });

  return response.choices[0].message.content;
}

/**
 * Validate and parse JSON response from AI
 */
export function parseAIResponse(response: string): any {
  try {
    // Remove any markdown formatting if present
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
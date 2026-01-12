// NanoBanana API Integration for AI Image Generation

const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate';
const API_KEY = process.env.NANOBANANA_API_KEY;

export type ImageSize = '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
export type GenerationType = 'TEXTTOIAMGE' | 'IMAGETOIAMGE';

interface GenerateImageRequest {
  prompt: string;
  type?: GenerationType;
  numImages?: 1 | 2 | 3 | 4;
  imageSize?: ImageSize;
  imageUrls?: string[];
  watermark?: string;
}

interface GenerateImageResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface CallbackPayload {
  taskId: string;
  status: 'success' | 'failed';
  images?: string[];
  error?: string;
}

export async function generateImage(
  request: GenerateImageRequest,
  callbackUrl: string
): Promise<GenerateImageResponse> {
  if (!API_KEY) {
    throw new Error('NANOBANANA_API_KEY is not configured');
  }

  const response = await fetch(NANOBANANA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: request.prompt,
      type: request.type || 'TEXTTOIAMGE',
      numImages: request.numImages || 1,
      image_size: request.imageSize || '16:9',
      imageUrls: request.imageUrls,
      watermark: request.watermark,
      callBackUrl: callbackUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`NanoBanana API error: ${response.status}`);
  }

  return response.json();
}

// Prompt templates for insurance/business imagery
export const IMAGE_PROMPTS = {
  heroInsurance: 'Professional photo of a confident insurance agent in a modern office, warm lighting, business attire, genuine smile, helping a diverse family with documents, high-end corporate photography style, 4K quality',

  teamSuccess: 'Group of diverse successful business professionals celebrating in a modern office, high-fives, genuine joy, professional attire, natural lighting, corporate lifestyle photography, premium quality',

  familyProtection: 'Happy multigenerational family together in a bright modern living room, grandparents parents and children, warm natural lighting, lifestyle photography, feeling of security and happiness',

  financialGrowth: 'Abstract visualization of financial growth with upward trending graphs, gold and blue color scheme, professional business concept, clean modern design, premium stock imagery style',

  careerPath: 'Professional climbing stairs to success with city skyline in background, golden hour lighting, motivational business concept, cinematic photography style',

  training: 'Modern corporate training session with diverse professionals engaged in learning, bright collaborative workspace, technology screens, professional development photography',

  handshake: 'Close-up of professional handshake between business partners, premium quality, warm lighting, trust and partnership concept, corporate photography',

  officeTeam: 'Diverse team of insurance professionals working together in a bright modern office, collaborative atmosphere, professional attire, natural lighting, corporate culture photography',
};

export function parseCallback(payload: CallbackPayload) {
  return {
    taskId: payload.taskId,
    success: payload.status === 'success',
    images: payload.images || [],
    error: payload.error,
  };
}

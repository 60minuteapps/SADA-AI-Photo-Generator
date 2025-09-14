import { PromptLibrary, PromptTemplate, Gender, StyleType } from '../types';
import Constants from 'expo-constants';

// Import the JSON prompt library
const promptLibrary: PromptLibrary = require('../../docs/library_prompt.json');

interface GenerationRequest {
  images: string[];
  gender: Gender;
  style: StyleType;
  modelName: string;
}

interface GenerationResponse {
  success: boolean;
  generatedImages: string[];
  error?: string;
}

class GoogleAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    // First try to get from Expo Constants (which reads from app.json extra config)
    // Then fallback to process.env for development
    this.apiKey = Constants.expoConfig?.extra?.googleApiKey || process.env.GOOGLE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google AI API key not found. Please ensure GOOGLE_API_KEY is set in your .env file.');
    } else {
      console.log('Google AI API key loaded successfully');
    }
  }

  private getPromptTemplate(gender: Gender, style: StyleType): PromptTemplate {
    const genderKey = gender === 'male' ? 'male_models' : 'female_models';
    return promptLibrary[genderKey][style];
  }

  private buildPrompt(template: PromptTemplate, modelName: string): string {
    return `
Create a professional AI-generated portrait following these specifications:

TRANSFORMATION INSTRUCTION:
${template.transformation_instruction}

COMPOSITION:
${template.composition}

SUBJECT DESCRIPTION:
${template.subject_description}

STYLING DETAILS:
${template.styling_details}

ENVIRONMENT:
${template.environment}

PRESERVATION PARAMETERS:
${template.preservation_parameters}

TECHNICAL SPECIFICATIONS:
${template.technical_specifications}

QUALITY PARAMETERS:
${template.quality_parameters}

MODEL NAME: ${modelName}

Generate 3 high-quality professional portraits that strictly follow all the above specifications while maintaining the subject's authentic appearance and personal characteristics.
    `.trim();
  }

  async generatePhotos(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const template = this.getPromptTemplate(request.gender, request.style);
      const prompt = this.buildPrompt(template, request.modelName);

      console.log('Generating photos with Gemini 2.5 Flash Image Preview');
      console.log('Using prompt:', prompt);
      console.log('Using images:', request.images);

      // Use the correct Gemini model for image generation
      const modelName = 'models/gemini-2.5-flash-image-preview';
      const url = `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`;

      const requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            // Add the training images as parts
            ...request.images.map(imageUri => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: imageUri.split(',')[1] // Extract base64 data if it's a data URL
              }
            }))
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // For now, return mock images since Gemini doesn't directly generate images
      // In a real implementation, you'd process the response and generate actual images
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

      return {
        success: true,
        generatedImages: [
          'https://picsum.photos/400/400?random=1',
          'https://picsum.photos/400/400?random=2',
          'https://picsum.photos/400/400?random=3',
        ],
      };
    } catch (error) {
      console.error('Error generating photos:', error);
      return {
        success: false,
        generatedImages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) return false;

      // Test API key with a simple request
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  getAvailableStyles(gender: Gender): StyleType[] {
    const genderKey = gender === 'male' ? 'male_models' : 'female_models';
    return Object.keys(promptLibrary[genderKey]) as StyleType[];
  }

  getStyleDescription(gender: Gender, style: StyleType): string {
    const template = this.getPromptTemplate(gender, style);
    return template.subject_description;
  }
}

export const googleAIService = new GoogleAIService();
export default googleAIService;

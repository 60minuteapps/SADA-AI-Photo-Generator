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
    this.apiKey = Constants.expoConfig?.extra?.googleApiKey || process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google AI API key not found. Please set GOOGLE_API_KEY in your environment.');
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

      // Simulate API call for now - replace with actual Google AI Studio API call
      console.log('Generating photos with prompt:', prompt);
      console.log('Using images:', request.images);

      // Mock response - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

      return {
        success: true,
        generatedImages: [
          'https://example.com/generated1.jpg',
          'https://example.com/generated2.jpg',
          'https://example.com/generated3.jpg',
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

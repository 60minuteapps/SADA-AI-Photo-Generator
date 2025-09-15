import { PromptLibrary, PromptTemplate, Gender, StyleType } from '../types';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

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

interface ProcessedImage {
  mimeType: string;
  data: string;
}

interface GoogleAIResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

class GoogleAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private modelName = 'gemini-2.5-flash-image-preview';

  constructor() {
    // Robust API key management with multiple fallback sources
    this.apiKey = this.getApiKey();
    
    if (!this.apiKey) {
      console.warn('⚠️ Google AI API key not found. Checked sources: EXPO_PUBLIC_GOOGLE_API_KEY, Constants.expoConfig.extra.googleApiKey, process.env.GOOGLE_API_KEY');
    } else {
      console.log('✅ Google AI API key loaded successfully');
    }
  }

  private getApiKey(): string {
    // Primary source: EXPO_PUBLIC_GOOGLE_API_KEY (recommended for Expo)
    if (process.env.EXPO_PUBLIC_GOOGLE_API_KEY) {
      return process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    }
    
    // Secondary source: Expo Constants from app.json extra config
    if (Constants.expoConfig?.extra?.googleApiKey) {
      return Constants.expoConfig.extra.googleApiKey;
    }
    
    // Tertiary source: Direct environment variable
    if (process.env.GOOGLE_API_KEY) {
      return process.env.GOOGLE_API_KEY;
    }
    
    // Fallback: Check Constants manifest (legacy support)
    if (Constants.manifest?.extra?.googleApiKey) {
      return Constants.manifest.extra.googleApiKey;
    }
    
    return '';
  }

  private getPromptTemplate(gender: Gender, style: StyleType): PromptTemplate {
    try {
      const genderKey = gender === 'male' ? 'male_models' : 'female_models';
      const template = promptLibrary[genderKey]?.[style];
      
      if (!template) {
        throw new Error(`Template not found for gender: ${gender}, style: ${style}`);
      }
      
      return template;
    } catch (error) {
      console.error('❌ Error getting prompt template:', error);
      throw new Error(`Failed to load prompt template for ${gender} ${style}`);
    }
  }

  private buildPrompt(template: PromptTemplate, modelName: string): string {
    const prompt = `Create 3 professional AI-generated portraits following these exact specifications:

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

MODEL REFERENCE: ${modelName}

IMPORTANT: Generate exactly 3 distinct professional portrait variations that maintain the subject's authentic appearance while following all styling specifications. Each portrait should be unique in pose or angle while maintaining consistent professional quality and style requirements.`;

    console.log('📝 Generated prompt for model:', modelName);
    return prompt.trim();
  }

  /**
   * Advanced image processing pipeline to handle various image formats
   */
  private async processImage(imageUri: string): Promise<ProcessedImage> {
    try {
      let base64Data: string;
      let mimeType: string;

      if (imageUri.startsWith('data:')) {
        // Handle data URLs (data:image/jpeg;base64,/9j/4AAQ...)
        const [header, data] = imageUri.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        base64Data = data;
        console.log('🔄 Processed data URL with MIME type:', mimeType);
      } else if (imageUri.startsWith('file://')) {
        // Handle file:// URLs using Expo FileSystem Legacy API
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) {
            throw new Error(`File not found: ${imageUri}`);
          }
          
          const base64String = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Detect MIME type from file extension
          mimeType = this.getMimeTypeFromUri(imageUri);
          base64Data = base64String;
          console.log('🔄 Processed file:// URL with MIME type:', mimeType);
        } catch (fsError) {
          console.error('❌ FileSystem error:', fsError);
          throw new Error(`Failed to read file: ${fsError instanceof Error ? fsError.message : 'Unknown file system error'}`);
        }
      } else if (this.isBase64String(imageUri)) {
        // Handle raw base64 strings
        base64Data = imageUri;
        mimeType = 'image/jpeg'; // Default assumption
        console.log('🔄 Processed raw base64 string');
      } else {
        throw new Error(`Unsupported image format: ${imageUri.substring(0, 50)}...`);
      }

      return { mimeType, data: base64Data };
    } catch (error) {
      console.error('❌ Error processing image:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMimeTypeFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }

  private isBase64String(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }

  /**
   * Process API response to extract base64 images and convert to data URLs
   */
  private processApiResponse(data: GoogleAIResponse): string[] {
    const generatedImages: string[] = [];
    
    try {
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates found in API response');
      }

      for (const candidate of data.candidates) {
        if (!candidate.content?.parts) {
          continue;
        }

        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const { mimeType, data: base64Data } = part.inlineData;
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            generatedImages.push(dataUrl);
            console.log('✅ Extracted image with MIME type:', mimeType);
          }
        }
      }

      if (generatedImages.length === 0) {
        throw new Error('No images found in API response');
      }

      // Ensure exactly 3 images are returned
      const targetCount = 3;
      if (generatedImages.length < targetCount) {
        console.warn(`⚠️ Only ${generatedImages.length} images generated, expected ${targetCount}`);
        // Duplicate images if needed to reach target count
        while (generatedImages.length < targetCount && generatedImages.length > 0) {
          generatedImages.push(generatedImages[generatedImages.length % generatedImages.length]);
        }
      } else if (generatedImages.length > targetCount) {
        console.log(`📏 Trimming to ${targetCount} images from ${generatedImages.length} generated`);
        generatedImages.splice(targetCount);
      }

      return generatedImages;
    } catch (error) {
      console.error('❌ Error processing API response:', error);
      throw new Error(`Failed to process API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePhotos(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Validation
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured. Please set EXPO_PUBLIC_GOOGLE_API_KEY in your environment.');
      }

      if (!request.images || request.images.length === 0) {
        throw new Error('At least one training image is required for portrait generation.');
      }

      console.log('🚀 Starting photo generation with Gemini 2.5 Flash Image Preview');
      console.log('📊 Request details:', {
        gender: request.gender,
        style: request.style,
        modelName: request.modelName,
        imageCount: request.images.length
      });

      // Get prompt template and build prompt
      const template = this.getPromptTemplate(request.gender, request.style);
      const prompt = this.buildPrompt(template, request.modelName);

      // Process all input images
      console.log('🖼️ Processing input images...');
      const processedImages = await Promise.all(
        request.images.map(async (imageUri, index) => {
          try {
            const processed = await this.processImage(imageUri);
            console.log(`✅ Processed image ${index + 1}/${request.images.length}`);
            return processed;
          } catch (error) {
            console.error(`❌ Failed to process image ${index + 1}:`, error);
            throw error;
          }
        })
      );

      // Build API request
      const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            ...processedImages.map(img => ({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data
              }
            }))
          ]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      };

      console.log('📡 Sending request to Google AI API...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SADA-AI-Photo-Generator/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use default error message
        }
        
        console.error('❌ API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data: GoogleAIResponse = await response.json();
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`API Error ${data.error.code}: ${data.error.message}`);
      }

      // Process response to extract images
      console.log('🔄 Processing API response...');
      const generatedImages = this.processApiResponse(data);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Successfully generated ${generatedImages.length} images in ${duration}ms`);

      return {
        success: true,
        generatedImages,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during photo generation';
      
      console.error(`❌ Photo generation failed after ${duration}ms:`, errorMessage);
      
      return {
        success: false,
        generatedImages: [],
        error: errorMessage,
      };
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ No API key available for validation');
        return false;
      }

      console.log('🔑 Validating Google AI API key...');
      
      // Test API key with a simple models list request
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SADA-AI-Photo-Generator/1.0'
        }
      });
      
      if (response.ok) {
        console.log('✅ API key validation successful');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ API key validation failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ API key validation error:', error);
      return false;
    }
  }

  getAvailableStyles(gender: Gender): StyleType[] {
    try {
      const genderKey = gender === 'male' ? 'male_models' : 'female_models';
      const styles = Object.keys(promptLibrary[genderKey] || {}) as StyleType[];
      
      if (styles.length === 0) {
        console.warn(`⚠️ No styles found for gender: ${gender}`);
      }
      
      return styles;
    } catch (error) {
      console.error('❌ Error getting available styles:', error);
      return [];
    }
  }

  getStyleDescription(gender: Gender, style: StyleType): string {
    try {
      const template = this.getPromptTemplate(gender, style);
      return template.subject_description;
    } catch (error) {
      console.error('❌ Error getting style description:', error);
      return `Professional ${style.replace('_', ' ')} portrait style`;
    }
  }

  /**
   * Get detailed information about the service configuration
   */
  getServiceInfo() {
    return {
      modelName: this.modelName,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      supportedFormats: ['file://', 'data:', 'base64'],
      maxImages: 3,
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };
  }
}

// Create and export singleton instance
export const googleAIService = new GoogleAIService();
export default googleAIService;

// Export types for external use
export type { GenerationRequest, GenerationResponse, ProcessedImage, GoogleAIResponse };

// Database types matching our Supabase schema
export interface UserSession {
  id: string;
  sessionToken: string;
  deviceId?: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

// Database PhotoPackage (matches Supabase schema)
export interface DBPhotoPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  gender: 'male' | 'female' | 'unisex';
  stylePrompt: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// UI PhotoPackage (includes UI-specific properties)
export interface PhotoPackage extends DBPhotoPackage {
  previewImage: any;
  styles: PhotoStyle[];
}

export interface GeneratedPhoto {
  id: string;
  sessionId: string;
  packageId?: string;
  originalPhotoUrl?: string;
  generatedPhotoUrl?: string;
  promptUsed?: string;
  generationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

// Legacy types for backward compatibility
export interface AIModel {
  id: string;
  name: string;
  gender: 'male' | 'female';
  trainingImages: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface PhotoStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  exampleImage: string;
  promptKey: string;
}

export interface User {
  id: string;
  email: string;
  aiModels: AIModel[];
  generatedPhotos: GeneratedPhoto[];
}

export interface AppState {
  currentSession: UserSession | null;
  selectedPackage: PhotoPackage | null;
  selectedModel: AIModel | null;
  selectedStyle: PhotoStyle | null;
  uploadedImages: string[];
  isGenerating: boolean;
  generationProgress: number;
  generatedPhotos: GeneratedPhoto[];
}

export interface PromptLibrary {
  female_models: {
    [key: string]: PromptTemplate;
  };
  male_models: {
    [key: string]: PromptTemplate;
  };
}

export interface PromptTemplate {
  transformation_instruction: string;
  composition: string;
  subject_description: string;
  styling_details: string;
  environment: string;
  preservation_parameters: string;
  technical_specifications: string;
  quality_parameters: string;
}

export type Gender = 'male' | 'female';
export type StyleType = 'business_suit' | 'office_professional' | 'street_casual' | 'business_casual';

export interface NavigationParams {
  package: string;
  gender: Gender;
  modelName: string;
  style: StyleType;
  images: string[];
}

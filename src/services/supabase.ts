import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AIModel, GeneratedPhoto, User } from '../types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for Expo
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

class SupabaseService {
  // User Management
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      return {
        id: profile.id,
        email: profile.email,
        aiModels: [],
        generatedPhotos: [],
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
          });

        if (profileError) {
          return { user: null, error: profileError.message };
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            aiModels: [],
            generatedPhotos: [],
          },
          error: null,
        };
      }

      return { user: null, error: 'Failed to create user' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const user = await this.getCurrentUser();
        return { user, error: null };
      }

      return { user: null, error: 'Failed to sign in' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // AI Model Management
  async saveAIModel(model: Omit<AIModel, 'id' | 'createdAt'>): Promise<{ model: AIModel | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { model: null, error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          user_id: user.id,
          name: model.name,
          gender: model.gender,
          training_images: model.trainingImages,
          is_active: model.isActive,
        })
        .select()
        .single();

      if (error) {
        return { model: null, error: error.message };
      }

      return {
        model: {
          id: data.id,
          name: data.name,
          gender: data.gender,
          trainingImages: data.training_images,
          createdAt: new Date(data.created_at),
          isActive: data.is_active,
        },
        error: null,
      };
    } catch (error) {
      return { model: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserAIModels(): Promise<{ models: AIModel[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { models: [], error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { models: [], error: error.message };
      }

      const models: AIModel[] = data.map(item => ({
        id: item.id,
        name: item.name,
        gender: item.gender,
        trainingImages: item.training_images,
        createdAt: new Date(item.created_at),
        isActive: item.is_active,
      }));

      return { models, error: null };
    } catch (error) {
      return { models: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generated Photos Management
  async saveGeneratedPhoto(photo: Omit<GeneratedPhoto, 'id' | 'createdAt'>): Promise<{ photo: GeneratedPhoto | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { photo: null, error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('generated_photos')
        .insert({
          user_id: user.id,
          url: photo.url,
          style: photo.style,
          model_id: photo.modelId,
          is_selected: photo.isSelected,
        })
        .select()
        .single();

      if (error) {
        return { photo: null, error: error.message };
      }

      return {
        photo: {
          id: data.id,
          url: data.url,
          style: data.style,
          modelId: data.model_id,
          createdAt: new Date(data.created_at),
          isSelected: data.is_selected,
        },
        error: null,
      };
    } catch (error) {
      return { photo: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserGeneratedPhotos(): Promise<{ photos: GeneratedPhoto[]; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { photos: [], error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('generated_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { photos: [], error: error.message };
      }

      const photos: GeneratedPhoto[] = data.map(item => ({
        id: item.id,
        url: item.url,
        style: item.style,
        modelId: item.model_id,
        createdAt: new Date(item.created_at),
        isSelected: item.is_selected,
      }));

      return { photos, error: null };
    } catch (error) {
      return { photos: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // File Upload
  async uploadImage(uri: string, fileName: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { url: null, error: 'User not authenticated' };

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(filePath, blob);

      if (error) {
        return { url: null, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserSession, PhotoPackage, GeneratedPhoto } from '../types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for anonymous access
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No authentication needed
    autoRefreshToken: false,
  },
});

const SESSION_STORAGE_KEY = 'anonymous_session_token';

class SupabaseService {
  private currentSession: UserSession | null = null;

  // Session Management
  async createAnonymousSession(deviceId?: string): Promise<{ session: UserSession | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('create_anonymous_session', {
        device_id_param: deviceId || null
      });

      if (error) {
        return { session: null, error: error.message };
      }

      if (data && data.length > 0) {
        const sessionData = data[0];
        const session: UserSession = {
          id: sessionData.session_id,
          sessionToken: sessionData.session_token,
          deviceId,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        // Store session token locally
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionData.session_token);
        this.currentSession = session;

        return { session, error: null };
      }

      return { session: null, error: 'Failed to create session' };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    try {
      const sessionToken = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionToken) return null;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      this.currentSession = {
        id: data.id,
        sessionToken: data.session_token,
        deviceId: data.device_id,
        createdAt: new Date(data.created_at),
        lastActiveAt: new Date(data.last_active_at),
        expiresAt: new Date(data.expires_at),
      };

      return this.currentSession;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  async updateSessionActivity(): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;

    try {
      await supabase.rpc('update_session_activity', {
        session_token_param: session.sessionToken
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  // Photo Package Management
  async getPhotoPackages(): Promise<{ packages: PhotoPackage[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('photo_packages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { packages: [], error: error.message };
      }

      const packages: PhotoPackage[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        gender: item.gender,
        stylePrompt: item.style_prompt,
        thumbnailUrl: item.thumbnail_url,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      return { packages, error: null };
    } catch (error) {
      return { packages: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPhotoPackageById(id: string): Promise<{ package: PhotoPackage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('photo_packages')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { package: null, error: error.message };
      }

      const photoPackage: PhotoPackage = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        gender: data.gender,
        stylePrompt: data.style_prompt,
        thumbnailUrl: data.thumbnail_url,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { package: photoPackage, error: null };
    } catch (error) {
      return { package: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generated Photos Management
  async createGeneratedPhoto(photo: {
    packageId?: string;
    originalPhotoUrl?: string;
    promptUsed?: string;
    metadata?: Record<string, any>;
  }): Promise<{ photo: GeneratedPhoto | null; error: string | null }> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return { photo: null, error: 'No active session' };
      }

      const { data, error } = await supabase
        .from('generated_photos')
        .insert({
          session_id: session.id,
          package_id: photo.packageId,
          original_photo_url: photo.originalPhotoUrl,
          prompt_used: photo.promptUsed,
          generation_status: 'pending',
          metadata: photo.metadata,
        })
        .select()
        .single();

      if (error) {
        return { photo: null, error: error.message };
      }

      const generatedPhoto: GeneratedPhoto = {
        id: data.id,
        sessionId: data.session_id,
        packageId: data.package_id,
        originalPhotoUrl: data.original_photo_url,
        generatedPhotoUrl: data.generated_photo_url,
        promptUsed: data.prompt_used,
        generationStatus: data.generation_status,
        errorMessage: data.error_message,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };

      return { photo: generatedPhoto, error: null };
    } catch (error) {
      return { photo: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateGeneratedPhoto(
    id: string,
    updates: {
      generatedPhotoUrl?: string;
      generationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
      errorMessage?: string;
      completedAt?: Date;
    }
  ): Promise<{ photo: GeneratedPhoto | null; error: string | null }> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return { photo: null, error: 'No active session' };
      }

      const updateData: any = {};
      if (updates.generatedPhotoUrl !== undefined) updateData.generated_photo_url = updates.generatedPhotoUrl;
      if (updates.generationStatus !== undefined) updateData.generation_status = updates.generationStatus;
      if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt.toISOString();

      const { data, error } = await supabase
        .from('generated_photos')
        .update(updateData)
        .eq('id', id)
        .eq('session_id', session.id)
        .select()
        .single();

      if (error) {
        return { photo: null, error: error.message };
      }

      const generatedPhoto: GeneratedPhoto = {
        id: data.id,
        sessionId: data.session_id,
        packageId: data.package_id,
        originalPhotoUrl: data.original_photo_url,
        generatedPhotoUrl: data.generated_photo_url,
        promptUsed: data.prompt_used,
        generationStatus: data.generation_status,
        errorMessage: data.error_message,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };

      return { photo: generatedPhoto, error: null };
    } catch (error) {
      return { photo: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getSessionGeneratedPhotos(): Promise<{ photos: GeneratedPhoto[]; error: string | null }> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return { photos: [], error: 'No active session' };
      }

      const { data, error } = await supabase
        .from('generated_photos')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { photos: [], error: error.message };
      }

      const photos: GeneratedPhoto[] = data.map(item => ({
        id: item.id,
        sessionId: item.session_id,
        packageId: item.package_id,
        originalPhotoUrl: item.original_photo_url,
        generatedPhotoUrl: item.generated_photo_url,
        promptUsed: item.prompt_used,
        generationStatus: item.generation_status,
        errorMessage: item.error_message,
        metadata: item.metadata,
        createdAt: new Date(item.created_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      }));

      return { photos, error: null };
    } catch (error) {
      return { photos: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // File Upload
  async uploadImage(uri: string, fileName: string, bucket: 'user-photos' | 'generated-photos' = 'user-photos'): Promise<{ url: string | null; error: string | null }> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return { url: null, error: 'No active session' };
      }

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      const filePath = `${session.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob);

      if (error) {
        return { url: null, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteImage(filePath: string, bucket: 'user-photos' | 'generated-photos' = 'user-photos'): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Initialize session on app start
  async initializeSession(deviceId?: string): Promise<UserSession | null> {
    let session = await this.getCurrentSession();
    
    if (!session) {
      const { session: newSession } = await this.createAnonymousSession(deviceId);
      session = newSession;
    }

    if (session) {
      await this.updateSessionActivity();
    }

    return session;
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;

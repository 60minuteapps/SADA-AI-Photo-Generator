import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { TrainingImage, GeneratedPhoto } from '../types';

interface StoredImage {
  id: string;
  uri: string;
  localPath: string;
  originalUrl?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface StoredTrainingImage extends StoredImage {
  displayOrder: number;
}

interface StoredGeneratedPhoto extends StoredImage {
  style: string;
  createdAt: string;
  packageId?: string;
  promptUsed?: string;
  generationStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

class ImageStorageService {
  private static readonly TRAINING_IMAGES_KEY = 'training_images';
  private static readonly GENERATED_PHOTOS_KEY = 'generated_photos';
  private static readonly AI_MODEL_KEY = 'ai_model_name';
  private static readonly IMAGES_DIRECTORY = `${FileSystem.documentDirectory}stored_images/`;

  // Initialize storage directory
  private async ensureStorageDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(ImageStorageService.IMAGES_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ImageStorageService.IMAGES_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating storage directory:', error);
    }
  }

  // Generate unique filename for stored image
  private generateFileName(id: string, extension: string = 'jpg'): string {
    return `${id}_${Date.now()}.${extension}`;
  }

  // Get local file path for image
  private getLocalPath(fileName: string): string {
    return `${ImageStorageService.IMAGES_DIRECTORY}${fileName}`;
  }

  // Store image file locally
  private async storeImageFile(uri: string, fileName: string): Promise<string> {
    await this.ensureStorageDirectory();
    const localPath = this.getLocalPath(fileName);

    try {
      if (uri.startsWith('data:')) {
        // Handle data URLs - convert base64 to file
        const base64Data = uri.split(',')[1];
        await FileSystem.writeAsStringAsync(localPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (uri.startsWith('file://')) {
        // Copy local file
        await FileSystem.copyAsync({ from: uri, to: localPath });
      } else {
        // Download remote file
        const downloadResult = await FileSystem.downloadAsync(uri, localPath);
        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
      }
      
      return localPath;
    } catch (error) {
      console.error('Error storing image file:', error);
      throw error;
    }
  }

  // Delete image file
  private async deleteImageFile(localPath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  // TRAINING IMAGES MANAGEMENT

  async saveTrainingImages(imageUris: string[]): Promise<StoredTrainingImage[]> {
    try {
      // Clear existing training images first
      await this.clearTrainingImages();

      const storedImages: StoredTrainingImage[] = [];
      
      for (let i = 0; i < imageUris.length; i++) {
        const id = `training_${Date.now()}_${i}`;
        const fileName = this.generateFileName(id);
        const localPath = await this.storeImageFile(imageUris[i], fileName);
        
        const storedImage: StoredTrainingImage = {
          id,
          uri: localPath,
          localPath,
          originalUrl: imageUris[i].startsWith('file://') ? undefined : imageUris[i],
          timestamp: Date.now(),
          displayOrder: i,
        };
        
        storedImages.push(storedImage);
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        ImageStorageService.TRAINING_IMAGES_KEY,
        JSON.stringify(storedImages)
      );

      return storedImages;
    } catch (error) {
      console.error('Error saving training images:', error);
      throw error;
    }
  }

  async getTrainingImages(): Promise<StoredTrainingImage[]> {
    try {
      const stored = await AsyncStorage.getItem(ImageStorageService.TRAINING_IMAGES_KEY);
      if (!stored) return [];

      const images: StoredTrainingImage[] = JSON.parse(stored);
      
      // Validate that files still exist
      const validImages: StoredTrainingImage[] = [];
      for (const image of images) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(image.localPath);
          if (fileInfo.exists) {
            validImages.push(image);
          }
        } catch (error) {
          console.warn('Training image file not found:', image.localPath);
        }
      }

      // Update storage if some files were missing
      if (validImages.length !== images.length) {
        await AsyncStorage.setItem(
          ImageStorageService.TRAINING_IMAGES_KEY,
          JSON.stringify(validImages)
        );
      }

      return validImages.sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (error) {
      console.error('Error getting training images:', error);
      return [];
    }
  }

  async deleteTrainingImage(id: string): Promise<void> {
    try {
      const images = await this.getTrainingImages();
      const imageToDelete = images.find(img => img.id === id);
      
      if (imageToDelete) {
        await this.deleteImageFile(imageToDelete.localPath);
      }
      
      const remainingImages = images.filter(img => img.id !== id);
      await AsyncStorage.setItem(
        ImageStorageService.TRAINING_IMAGES_KEY,
        JSON.stringify(remainingImages)
      );
    } catch (error) {
      console.error('Error deleting training image:', error);
      throw error;
    }
  }

  async clearTrainingImages(): Promise<void> {
    try {
      const images = await this.getTrainingImages();
      
      // Delete all image files
      for (const image of images) {
        await this.deleteImageFile(image.localPath);
      }
      
      // Clear from AsyncStorage
      await AsyncStorage.removeItem(ImageStorageService.TRAINING_IMAGES_KEY);
    } catch (error) {
      console.error('Error clearing training images:', error);
      throw error;
    }
  }

  // GENERATED PHOTOS MANAGEMENT

  async saveGeneratedPhoto(photoData: {
    id?: string;
    uri: string;
    style: string;
    packageId?: string;
    promptUsed?: string;
    generationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    metadata?: Record<string, any>;
  }): Promise<StoredGeneratedPhoto> {
    try {
      const id = photoData.id || `generated_${Date.now()}`;
      const fileName = this.generateFileName(id);
      const localPath = await this.storeImageFile(photoData.uri, fileName);
      
      const storedPhoto: StoredGeneratedPhoto = {
        id,
        uri: localPath,
        localPath,
        originalUrl: photoData.uri.startsWith('file://') ? undefined : photoData.uri,
        timestamp: Date.now(),
        style: photoData.style,
        createdAt: new Date().toISOString(),
        packageId: photoData.packageId,
        promptUsed: photoData.promptUsed,
        generationStatus: photoData.generationStatus || 'completed',
        metadata: photoData.metadata,
      };

      // Get existing photos and add new one
      const existingPhotos = await this.getGeneratedPhotos();
      const updatedPhotos = [storedPhoto, ...existingPhotos];

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        ImageStorageService.GENERATED_PHOTOS_KEY,
        JSON.stringify(updatedPhotos)
      );

      return storedPhoto;
    } catch (error) {
      console.error('Error saving generated photo:', error);
      throw error;
    }
  }

  async getGeneratedPhotos(): Promise<StoredGeneratedPhoto[]> {
    try {
      const stored = await AsyncStorage.getItem(ImageStorageService.GENERATED_PHOTOS_KEY);
      if (!stored) return [];

      const photos: StoredGeneratedPhoto[] = JSON.parse(stored);
      
      // Validate that files still exist
      const validPhotos: StoredGeneratedPhoto[] = [];
      for (const photo of photos) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(photo.localPath);
          if (fileInfo.exists) {
            validPhotos.push(photo);
          }
        } catch (error) {
          console.warn('Generated photo file not found:', photo.localPath);
        }
      }

      // Update storage if some files were missing
      if (validPhotos.length !== photos.length) {
        await AsyncStorage.setItem(
          ImageStorageService.GENERATED_PHOTOS_KEY,
          JSON.stringify(validPhotos)
        );
      }

      return validPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting generated photos:', error);
      return [];
    }
  }

  async updateGeneratedPhoto(id: string, updates: Partial<StoredGeneratedPhoto>): Promise<StoredGeneratedPhoto | null> {
    try {
      const photos = await this.getGeneratedPhotos();
      const photoIndex = photos.findIndex(photo => photo.id === id);
      
      if (photoIndex === -1) return null;
      
      const updatedPhoto = { ...photos[photoIndex], ...updates };
      photos[photoIndex] = updatedPhoto;
      
      await AsyncStorage.setItem(
        ImageStorageService.GENERATED_PHOTOS_KEY,
        JSON.stringify(photos)
      );
      
      return updatedPhoto;
    } catch (error) {
      console.error('Error updating generated photo:', error);
      return null;
    }
  }

  async deleteGeneratedPhoto(id: string): Promise<void> {
    try {
      const photos = await this.getGeneratedPhotos();
      const photoToDelete = photos.find(photo => photo.id === id);
      
      if (photoToDelete) {
        await this.deleteImageFile(photoToDelete.localPath);
      }
      
      const remainingPhotos = photos.filter(photo => photo.id !== id);
      await AsyncStorage.setItem(
        ImageStorageService.GENERATED_PHOTOS_KEY,
        JSON.stringify(remainingPhotos)
      );
    } catch (error) {
      console.error('Error deleting generated photo:', error);
      throw error;
    }
  }

  async clearGeneratedPhotos(): Promise<void> {
    try {
      const photos = await this.getGeneratedPhotos();
      
      // Delete all image files
      for (const photo of photos) {
        await this.deleteImageFile(photo.localPath);
      }
      
      // Clear from AsyncStorage
      await AsyncStorage.removeItem(ImageStorageService.GENERATED_PHOTOS_KEY);
    } catch (error) {
      console.error('Error clearing generated photos:', error);
      throw error;
    }
  }

  // AI MODEL MANAGEMENT

  async setAIModelName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ImageStorageService.AI_MODEL_KEY, name);
    } catch (error) {
      console.error('Error setting AI model name:', error);
      throw error;
    }
  }

  async getAIModelName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ImageStorageService.AI_MODEL_KEY);
    } catch (error) {
      console.error('Error getting AI model name:', error);
      return null;
    }
  }

  async clearAIModel(): Promise<void> {
    try {
      await this.clearTrainingImages();
      await this.clearGeneratedPhotos();
      await AsyncStorage.removeItem(ImageStorageService.AI_MODEL_KEY);
    } catch (error) {
      console.error('Error clearing AI model:', error);
      throw error;
    }
  }

  // UTILITY METHODS

  async getStorageStats(): Promise<{
    trainingImagesCount: number;
    generatedPhotosCount: number;
    totalStorageSize: number;
  }> {
    try {
      const trainingImages = await this.getTrainingImages();
      const generatedPhotos = await this.getGeneratedPhotos();
      
      let totalSize = 0;
      
      // Calculate training images size
      for (const image of trainingImages) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(image.localPath);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += (fileInfo as any).size || 0;
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
      
      // Calculate generated photos size
      for (const photo of generatedPhotos) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(photo.localPath);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += (fileInfo as any).size || 0;
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
      
      return {
        trainingImagesCount: trainingImages.length,
        generatedPhotosCount: generatedPhotos.length,
        totalStorageSize: totalSize,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        trainingImagesCount: 0,
        generatedPhotosCount: 0,
        totalStorageSize: 0,
      };
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.clearAIModel();
      
      // Clean up any remaining files in the directory
      try {
        const dirInfo = await FileSystem.getInfoAsync(ImageStorageService.IMAGES_DIRECTORY);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(ImageStorageService.IMAGES_DIRECTORY, { idempotent: true });
        }
      } catch (error) {
        console.warn('Error cleaning up storage directory:', error);
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const imageStorageService = new ImageStorageService();
export default imageStorageService;

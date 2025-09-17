import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';

interface CachedImage {
  uri: string;
  localPath: string;
  timestamp: number;
  size: number;
  originalUrl: string;
}

interface CacheMetadata {
  totalSize: number;
  lastCleanup: number;
  imageCount: number;
}

class ImageCacheService {
  private static readonly CACHE_PREFIX = 'image_cache_';
  private static readonly METADATA_KEY = 'image_cache_metadata';
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly CACHE_DIRECTORY = `${FileSystem.documentDirectory}images/`;

  // Initialize cache directory
  private async ensureCacheDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(ImageCacheService.CACHE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ImageCacheService.CACHE_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  // Generate cache key from URL
  private getCacheKey(url: string): string {
    return ImageCacheService.CACHE_PREFIX + btoa(url).replace(/[/+=]/g, '');
  }

  // Get local file path for cached image
  private getLocalPath(cacheKey: string): string {
    return `${ImageCacheService.CACHE_DIRECTORY}${cacheKey}.jpg`;
  }

  // Get cache metadata
  private async getCacheMetadata(): Promise<CacheMetadata> {
    try {
      const metadataStr = await AsyncStorage.getItem(ImageCacheService.METADATA_KEY);
      if (metadataStr) {
        return JSON.parse(metadataStr);
      }
    } catch (error) {
      console.error('Error getting cache metadata:', error);
    }
    
    return {
      totalSize: 0,
      lastCleanup: Date.now(),
      imageCount: 0,
    };
  }

  // Update cache metadata
  private async updateCacheMetadata(metadata: CacheMetadata): Promise<void> {
    try {
      await AsyncStorage.setItem(ImageCacheService.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error updating cache metadata:', error);
    }
  }

  // Check if image is cached and valid
  async isCached(url: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachedDataStr = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedDataStr) return false;
      
      const cachedData: CachedImage = JSON.parse(cachedDataStr);
      const isExpired = Date.now() - cachedData.timestamp > ImageCacheService.MAX_CACHE_AGE;
      
      if (isExpired) {
        await this.removeFromCache(url);
        return false;
      }
      
      // Check if local file still exists
      const fileInfo = await FileSystem.getInfoAsync(cachedData.localPath);
      if (!fileInfo.exists) {
        await this.removeFromCache(url);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  // Get cached image URI
  async getCachedUri(url: string): Promise<string | null> {
    try {
      const isCachedResult = await this.isCached(url);
      if (!isCachedResult) return null;
      
      const cacheKey = this.getCacheKey(url);
      const cachedDataStr = await AsyncStorage.getItem(cacheKey);
      
      if (cachedDataStr) {
        const cachedData: CachedImage = JSON.parse(cachedDataStr);
        return cachedData.localPath;
      }
    } catch (error) {
      console.error('Error getting cached URI:', error);
    }
    
    return null;
  }

  // Cache an image from URL
  async cacheImage(url: string): Promise<string | null> {
    try {
      // Skip if already cached
      const existingUri = await this.getCachedUri(url);
      if (existingUri) return existingUri;

      await this.ensureCacheDirectory();
      
      const cacheKey = this.getCacheKey(url);
      const localPath = this.getLocalPath(cacheKey);
      
      // Download image to local cache
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const fileSize = (fileInfo.exists && !fileInfo.isDirectory) ? (fileInfo as any).size || 0 : 0;
      
      // Store cache metadata
      const cachedImage: CachedImage = {
        uri: localPath,
        localPath,
        timestamp: Date.now(),
        size: fileSize,
        originalUrl: url,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedImage));
      
      // Update cache metadata
      const metadata = await this.getCacheMetadata();
      metadata.totalSize += fileSize;
      metadata.imageCount += 1;
      await this.updateCacheMetadata(metadata);
      
      // Check if cache cleanup is needed
      if (metadata.totalSize > ImageCacheService.MAX_CACHE_SIZE) {
        await this.cleanupCache();
      }
      
      return localPath;
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  }

  // Remove image from cache
  async removeFromCache(url: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachedDataStr = await AsyncStorage.getItem(cacheKey);
      
      if (cachedDataStr) {
        const cachedData: CachedImage = JSON.parse(cachedDataStr);
        
        // Delete local file
        try {
          await FileSystem.deleteAsync(cachedData.localPath, { idempotent: true });
        } catch (fileError) {
          console.error('Error deleting cached file:', fileError);
        }
        
        // Remove from AsyncStorage
        await AsyncStorage.removeItem(cacheKey);
        
        // Update metadata
        const metadata = await this.getCacheMetadata();
        metadata.totalSize = Math.max(0, metadata.totalSize - cachedData.size);
        metadata.imageCount = Math.max(0, metadata.imageCount - 1);
        await this.updateCacheMetadata(metadata);
      }
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  // Clean up old and large cache entries
  async cleanupCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(ImageCacheService.CACHE_PREFIX));
      
      const cachedImages: (CachedImage & { key: string })[] = [];
      
      // Get all cached images with their keys
      for (const key of cacheKeys) {
        try {
          const cachedDataStr = await AsyncStorage.getItem(key);
          if (cachedDataStr) {
            const cachedData: CachedImage = JSON.parse(cachedDataStr);
            cachedImages.push({ ...cachedData, key });
          }
        } catch (error) {
          // Remove corrupted entries
          await AsyncStorage.removeItem(key);
        }
      }
      
      // Sort by timestamp (oldest first)
      cachedImages.sort((a, b) => a.timestamp - b.timestamp);
      
      let currentSize = cachedImages.reduce((total, img) => total + img.size, 0);
      const targetSize = ImageCacheService.MAX_CACHE_SIZE * 0.8; // Clean to 80% of max size
      
      // Remove oldest images until we're under target size
      for (const cachedImage of cachedImages) {
        if (currentSize <= targetSize) break;
        
        try {
          await FileSystem.deleteAsync(cachedImage.localPath, { idempotent: true });
          await AsyncStorage.removeItem(cachedImage.key);
          currentSize -= cachedImage.size;
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
      
      // Update metadata
      const remainingImages = cachedImages.filter(img => currentSize > targetSize ? false : true);
      const metadata: CacheMetadata = {
        totalSize: remainingImages.reduce((total, img) => total + img.size, 0),
        imageCount: remainingImages.length,
        lastCleanup: Date.now(),
      };
      
      await this.updateCacheMetadata(metadata);
      
      console.log(`Cache cleanup completed. Size: ${metadata.totalSize} bytes, Images: ${metadata.imageCount}`);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  // Get image with caching (main method to use)
  async getImage(url: string): Promise<string> {
    try {
      // Return original URL if it's a local file or data URL
      if (url.startsWith('file://') || url.startsWith('data:')) {
        return url;
      }
      
      // Check cache first
      const cachedUri = await this.getCachedUri(url);
      if (cachedUri) {
        return cachedUri;
      }
      
      // Cache the image and return cached URI or original URL as fallback
      const newCachedUri = await this.cacheImage(url);
      return newCachedUri || url;
    } catch (error) {
      console.error('Error getting image:', error);
      return url; // Fallback to original URL
    }
  }

  // Preload multiple images
  async preloadImages(urls: string[]): Promise<void> {
    try {
      const promises = urls
        .filter(url => !url.startsWith('file://') && !url.startsWith('data:'))
        .map(url => this.cacheImage(url));
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        key.startsWith(ImageCacheService.CACHE_PREFIX) || key === ImageCacheService.METADATA_KEY
      );
      
      // Remove from AsyncStorage
      await AsyncStorage.multiRemove(cacheKeys);
      
      // Clear cache directory
      try {
        const dirInfo = await FileSystem.getInfoAsync(ImageCacheService.CACHE_DIRECTORY);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(ImageCacheService.CACHE_DIRECTORY, { idempotent: true });
        }
      } catch (error) {
        console.error('Error clearing cache directory:', error);
      }
      
      console.log('Image cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<CacheMetadata> {
    return await this.getCacheMetadata();
  }
}

export const imageCacheService = new ImageCacheService();
export default imageCacheService;

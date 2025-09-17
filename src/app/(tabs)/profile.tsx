import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { theme, globalStyles } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabaseService } from '../../services/supabase';
import { GeneratedPhoto as DBGeneratedPhoto } from '../../types';

interface UploadedImage {
  id: string;
  uri: string;
}

interface GeneratedPhoto {
  id: string;
  uri: string;
  style: string;
  createdAt: Date;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    newPhotos?: string;
    modelName?: string;
    style?: string;
    recordId?: string;
  }>();
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [generatedPhotos, setGeneratedPhotos] = useState<GeneratedPhoto[]>([]);
  const [aiModelName, setAiModelName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedPhoto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load generated photos from database
  useEffect(() => {
    loadGeneratedPhotos();
  }, []);

  // Handle new photos from generation (fallback for URL params)
  useEffect(() => {
    if (params.newPhotos && params.modelName && params.style) {
      try {
        const newPhotoUrls = JSON.parse(params.newPhotos);
        const newPhotos: GeneratedPhoto[] = newPhotoUrls.map((url: string, index: number) => ({
          id: `${Date.now()}_${index}`,
          uri: url,
          style: params.style || 'professional',
          createdAt: new Date(),
        }));
        
        setGeneratedPhotos(prev => [...newPhotos, ...prev]);
        setAiModelName(params.modelName || '');
      } catch (error) {
        console.error('Error parsing new photos:', error);
      }
    }
  }, [params.newPhotos, params.modelName, params.style]);

  const loadGeneratedPhotos = async () => {
    try {
      setIsLoading(true);
      const { photos, error } = await supabaseService.getSessionGeneratedPhotos();
      
      if (error) {
        console.error('Error loading generated photos:', error);
        return;
      }

      // Convert database photos to UI format
      const uiPhotos: GeneratedPhoto[] = photos
        .filter(photo => photo.generatedPhotoUrl) // Only show completed photos
        .map(photo => ({
          id: photo.id,
          uri: photo.generatedPhotoUrl!,
          style: photo.metadata?.style || 'professional',
          createdAt: photo.createdAt,
        }));

      setGeneratedPhotos(uiPhotos);

      // Set AI model name from the most recent photo
      if (photos.length > 0 && photos[0].metadata?.modelName) {
        setAiModelName(photos[0].metadata.modelName);
      }
    } catch (error) {
      console.error('Error loading generated photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 3 - uploadedImages.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset, index) => ({
        id: `${Date.now()}_${index}`,
        uri: asset.uri,
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const newImage = {
        id: `${Date.now()}`,
        uri: result.assets[0].uri,
      };
      setUploadedImages(prev => [...prev, newImage]);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const showImageOptions = () => {
    if (uploadedImages.length >= 3) {
      Alert.alert('Maximum reached', 'You can upload up to 3 training images.');
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImages },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const deleteAIModel = async () => {
    Alert.alert(
      'Delete AI Model',
      'Are you sure you want to delete your AI model? This will also remove all generated photos and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all generated photos from database
              const { error } = await supabaseService.deleteSessionGeneratedPhotos();
              
              if (error) {
                console.error('Error deleting generated photos:', error);
                Alert.alert('Error', 'Failed to delete AI model. Please try again.');
                return;
              }
              
              // Clear local state after successful database deletion
              setAiModelName('');
              setGeneratedPhotos([]);
              setUploadedImages([]);
            } catch (error) {
              console.error('Error deleting AI model:', error);
              Alert.alert('Error', 'Failed to delete AI model. Please try again.');
            }
          }
        },
      ]
    );
  };

  const downloadImage = async () => {
    if (!selectedImage) return;
    
    try {
      setIsDownloading(true);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media library permissions to save images.');
        return;
      }

      // Generate filename with timestamp and style
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `AI_Portrait_${selectedImage.style}_${timestamp}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      let finalUri: string;

      // Handle data URLs (base64) differently from regular URLs
      if (selectedImage.uri.startsWith('data:')) {
        // Convert data URL to file
        const base64Data = selectedImage.uri.split(',')[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        finalUri = fileUri;
      } else {
        // Regular URL - use downloadAsync
        const downloadResult = await FileSystem.downloadAsync(selectedImage.uri, fileUri);
        if (downloadResult.status !== 200) {
          throw new Error('Download failed');
        }
        finalUri = downloadResult.uri;
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      
      // Create album if it doesn't exist
      const albumName = 'AI Professional Photos';
      let album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      Alert.alert(
        'Download Complete',
        `Image saved to your photo library in the "${albumName}" album.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Unable to save the image. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* AI Model Section */}
        <Card style={styles.section}>
          <Text style={globalStyles.title}>My AI Model</Text>
          {aiModelName ? (
            <View style={styles.modelInfoContainer}>
              <View style={styles.modelInfo}>
                <MaterialIcons name="smart-toy" size={24} color={theme.colors.accent} />
                <Text style={styles.modelName}>{aiModelName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={deleteAIModel}
              >
                <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={globalStyles.caption}>No AI model created yet</Text>
          )}
        </Card>

        {/* Training Images Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={globalStyles.subtitle}>Training Images</Text>
            <Text style={styles.imageCount}>{uploadedImages.length}/3</Text>
          </View>
          
          <View style={styles.imageGrid}>
            {uploadedImages.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(image.id)}
                >
                  <MaterialIcons name="close" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            
            {uploadedImages.length < 3 && (
              <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                <MaterialIcons name="add" size={32} color={theme.colors.textSecondary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {uploadedImages.length > 0 && uploadedImages.length < 3 && (
            <Text style={styles.helperText}>
              Add {3 - uploadedImages.length} more photo{3 - uploadedImages.length > 1 ? 's' : ''} to train your AI model
            </Text>
          )}
        </Card>

        {/* Generated Photos Section */}
        <Card style={styles.section}>
          <Text style={globalStyles.subtitle}>Generated Photos</Text>
          {isLoading ? (
            <View style={styles.loadingState}>
              <MaterialIcons name="hourglass-empty" size={24} color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
          ) : generatedPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {generatedPhotos.map((photo) => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoContainer}
                  onPress={() => {
                    setSelectedImage(photo);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: photo.uri }} style={styles.generatedPhoto} />
                  <Text style={styles.photoStyle}>{photo.style.replace('_', ' ')}</Text>
                  <Text style={styles.photoDate}>
                    {photo.createdAt.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="photo-library" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>No generated photos yet</Text>
              <Text style={globalStyles.caption}>
                Upload 3 training images and generate your first professional photos
              </Text>
            </View>
          )}
        </Card>

        {/* Action Button */}
        {uploadedImages.length === 3 && (
          <View style={styles.actionSection}>
            <Button
              title="Generate Professional Photos"
              onPress={() => {
                // Navigate to package selection
                console.log('Navigate to explore screen');
              }}
              size="large"
            />
          </View>
        )}
      </ScrollView>
      
      {/* Full-Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close Button - Top Right */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={28} color={theme.colors.white} />
            </TouchableOpacity>
            
            {/* Download Button - Top Right, Left of Close */}
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={downloadImage}
              disabled={isDownloading}
            >
              <MaterialIcons 
                name={isDownloading ? "hourglass-empty" : "download"} 
                size={24} 
                color={theme.colors.white} 
              />
            </TouchableOpacity>
            
            {/* Image */}
            {selectedImage && (
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: selectedImage.uri }} 
                  style={styles.fullScreenImage}
                  contentFit="contain"
                />
                
                {/* Image Info */}
                <View style={styles.imageInfo}>
                  <Text style={styles.modalImageStyle}>
                    {selectedImage.style.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.modalImageDate}>
                    Generated on {selectedImage.createdAt.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  {aiModelName && (
                    <Text style={styles.modalModelName}>
                      Model: {aiModelName}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  imageCount: {
    ...globalStyles.caption,
    color: theme.colors.accent,
    fontFamily: theme.fonts.medium,
  },
  modelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  modelName: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.error,
    minWidth: theme.touchTarget.minHeight,
    minHeight: theme.touchTarget.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  addImageText: {
    ...globalStyles.caption,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  helperText: {
    ...globalStyles.caption,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  photoContainer: {
    alignItems: 'center',
  },
  generatedPhoto: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
  },
  photoStyle: {
    ...globalStyles.caption,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: theme.spacing.xl,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...globalStyles.body,
    color: theme.colors.accent,
  },
  photoDate: {
    ...globalStyles.caption,
    marginTop: theme.spacing.xs / 2,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - (theme.spacing.lg * 2),
    height: Dimensions.get('window').height * 0.7,
    borderRadius: theme.borderRadius.lg,
  },
  imageInfo: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: '80%',
  },
  modalImageStyle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  modalImageDate: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  modalModelName: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.accent,
    textAlign: 'center',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: theme.spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: theme.touchTarget.minHeight,
    minHeight: theme.touchTarget.minHeight,
  },
  downloadButton: {
    position: 'absolute',
    top: 60,
    right: theme.spacing.lg + 48 + theme.spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: theme.touchTarget.minHeight,
    minHeight: theme.touchTarget.minHeight,
  },
});

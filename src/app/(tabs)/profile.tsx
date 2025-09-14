import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme, globalStyles } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [generatedPhotos, setGeneratedPhotos] = useState<GeneratedPhoto[]>([]);
  const [aiModelName, setAiModelName] = useState<string>('');

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

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* AI Model Section */}
        <Card style={styles.section}>
          <Text style={globalStyles.title}>My AI Model</Text>
          {aiModelName ? (
            <View style={styles.modelInfo}>
              <MaterialIcons name="smart-toy" size={24} color={theme.colors.accent} />
              <Text style={styles.modelName}>{aiModelName}</Text>
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
          {generatedPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {generatedPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.generatedPhoto} />
                  <Text style={styles.photoStyle}>{photo.style}</Text>
                </View>
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
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modelName: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
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
});

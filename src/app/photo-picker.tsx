import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface SelectedImage {
  id: string;
  uri: string;
}

export default function PhotoPickerScreen() {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 3 - selectedImages.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset, index) => ({
        id: `${Date.now()}_${index}`,
        uri: asset.uri,
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
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
      setSelectedImages(prev => [...prev, newImage]);
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleContinue = () => {
    if (selectedImages.length === 3) {
      router.push({
        pathname: '/gender-selection',
        params: { images: JSON.stringify(selectedImages.map(img => img.uri)) }
      });
    }
  };

  const showImageOptions = () => {
    if (selectedImages.length >= 3) {
      Alert.alert('Maximum reached', 'You can select up to 3 training images.');
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Select Training Photos</Text>
          <Text style={globalStyles.body}>
            Choose 3 high-quality photos of yourself for the best AI model training results
          </Text>
        </View>

        {/* Photo Guidelines */}
        <Card style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Photo Guidelines</Text>
          <View style={styles.guidelinesList}>
            <View style={styles.guideline}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.guidelineText}>Clear, well-lit photos</Text>
            </View>
            <View style={styles.guideline}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.guidelineText}>Face clearly visible</Text>
            </View>
            <View style={styles.guideline}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.guidelineText}>Different angles/expressions</Text>
            </View>
            <View style={styles.guideline}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
              <Text style={styles.guidelineText}>High resolution (min 1080p)</Text>
            </View>
          </View>
        </Card>

        {/* Selected Images */}
        <Card style={styles.imagesCard}>
          <View style={styles.imagesHeader}>
            <Text style={globalStyles.subtitle}>Selected Photos</Text>
            <Text style={styles.imageCount}>{selectedImages.length}/3</Text>
          </View>
          
          <View style={styles.imageGrid}>
            {selectedImages.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(image.id)}
                >
                  <MaterialIcons name="close" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            
            {Array.from({ length: 3 - selectedImages.length }).map((_, index) => (
              <TouchableOpacity 
                key={`placeholder-${index}`}
                style={styles.addImageButton} 
                onPress={showImageOptions}
              >
                <MaterialIcons name="add" size={32} color={theme.colors.textSecondary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedImages.length > 0 && selectedImages.length < 3 && (
            <Text style={styles.helperText}>
              Add {3 - selectedImages.length} more photo{3 - selectedImages.length > 1 ? 's' : ''} to continue
            </Text>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Take Photo"
            onPress={takePhoto}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Choose from Library"
            onPress={pickFromLibrary}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        {/* Continue Button */}
        {selectedImages.length === 3 && (
          <View style={styles.continueSection}>
            <Button
              title="Continue"
              onPress={handleContinue}
              size="large"
            />
          </View>
        )}

        {/* Tips Section */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for Best Results</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Use photos taken in good natural lighting</Text>
            <Text style={styles.tip}>• Avoid heavily filtered or edited images</Text>
            <Text style={styles.tip}>• Include variety in poses and expressions</Text>
            <Text style={styles.tip}>• Make sure your face takes up most of the frame</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  guidelinesCard: {
    marginBottom: theme.spacing.lg,
  },
  guidelinesTitle: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  guidelinesList: {
    gap: theme.spacing.sm,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  guidelineText: {
    ...globalStyles.body,
    flex: 1,
  },
  imagesCard: {
    marginBottom: theme.spacing.lg,
  },
  imagesHeader: {
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  imageContainer: {
    position: 'relative',
    width: '30%',
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 1,
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
    width: '30%',
    aspectRatio: 1,
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
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  continueSection: {
    marginBottom: theme.spacing.lg,
  },
  tipsCard: {
    marginBottom: theme.spacing.xl,
  },
  tipsTitle: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  tipsList: {
    gap: theme.spacing.sm,
  },
  tip: {
    ...globalStyles.caption,
    lineHeight: 20,
  },
});

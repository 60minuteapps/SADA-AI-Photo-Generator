import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Gender, StyleType, GeneratedPhoto } from '../types';
import googleAIService from '../services/googleAI';
import { supabaseService } from '../services/supabase';

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function GenerationProgressScreen() {
  const { images, gender, modelName, style } = useLocalSearchParams<{ 
    images: string; 
    gender: Gender; 
    modelName: string;
    style: StyleType;
  }>();
  
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  const steps: GenerationStep[] = [
    {
      id: 'upload',
      title: 'Processing Images',
      description: 'Analyzing your training photos',
      completed: false,
    },
    {
      id: 'training',
      title: 'Training AI Model',
      description: 'Creating your personalized AI model',
      completed: false,
    },
    {
      id: 'generation',
      title: 'Generating Photos',
      description: 'Creating professional photos in your selected style',
      completed: false,
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Your professional photos are ready!',
      completed: false,
    },
  ];

  const [generationSteps, setGenerationSteps] = useState(steps);

  useEffect(() => {
    startGeneration();
  }, []);

  // Start animations when generating
  useEffect(() => {
    if (isGenerating && !error) {
      // Pulse animation for the loading indicator
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Dots animation for the text
      const dotsAnimation = Animated.loop(
        Animated.timing(dotsAnim, {
          toValue: 3,
          duration: 1500,
          useNativeDriver: false,
        })
      );

      pulseAnimation.start();
      dotsAnimation.start();

      return () => {
        pulseAnimation.stop();
        dotsAnimation.stop();
      };
    }
  }, [isGenerating, error]);

  const startGeneration = async () => {
    if (!images || !gender || !modelName || !style) {
      setError('Missing required parameters');
      return;
    }

    setIsGenerating(true);
    const imageList = JSON.parse(images);

    try {
      const promptUsed = `Professional ${style.replace('_', ' ')} style photo for ${modelName} (${gender})`;

      // Step 1: Processing Images
      setCurrentStep(0);
      updateStepCompletion(0, false);
      
      // Upload training images to storage
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < imageList.length; i++) {
        const imageUri = imageList[i];
        const fileName = `training_${i + 1}_${Date.now()}.jpg`;
        const { url, error: uploadError } = await supabaseService.uploadImage(imageUri, fileName, 'user-photos');
        
        if (uploadError || !url) {
          console.warn(`Failed to upload training image ${i + 1}:`, uploadError);
        } else {
          uploadedImageUrls.push(url);
        }
      }

      await simulateDelay(2000);
      updateStepCompletion(0, true);

      // Step 2: Training AI Model
      setCurrentStep(1);
      updateStepCompletion(1, false);
      await simulateDelay(3000);
      updateStepCompletion(1, true);

      // Step 3: Generating Photos
      setCurrentStep(2);
      updateStepCompletion(2, false);
      
      const result = await googleAIService.generatePhotos({
        images: imageList,
        gender,
        style,
        modelName,
      });

      if (result.success) {
        // Upload generated images to Supabase storage
        const uploadedGeneratedUrls: string[] = [];
        for (let i = 0; i < result.generatedImages.length; i++) {
          const imageUrl = result.generatedImages[i];
          
          try {
            // For mock URLs, we'll store them directly
            // In production, you'd download and re-upload to your storage
            uploadedGeneratedUrls.push(imageUrl);
          } catch (uploadError) {
            console.warn(`Failed to process generated image ${i + 1}:`, uploadError);
            uploadedGeneratedUrls.push(imageUrl); // Fallback to original URL
          }
        }

        // Save each generated image to AsyncStorage
        const savedPhotos = [];
        for (let i = 0; i < uploadedGeneratedUrls.length; i++) {
          const imageUrl = uploadedGeneratedUrls[i];
          
          try {
            const { photo: savedPhoto, error: saveError } = await supabaseService.saveGeneratedPhoto({
              uri: imageUrl,
              style,
              promptUsed,
              metadata: {
                modelName,
                style,
                gender,
                trainingImageCount: imageList.length,
                variationIndex: i + 1
              }
            });
            
            if (saveError) {
              console.warn(`Failed to save generated photo ${i + 1}:`, saveError);
            } else {
              savedPhotos.push(savedPhoto);
            }
          } catch (error) {
            console.warn(`Error saving generated photo ${i + 1}:`, error);
          }
        }
        
        console.log(`✅ Saved ${savedPhotos.length} images to database`);

        setGeneratedImages(uploadedGeneratedUrls);
        updateStepCompletion(2, true);
        
        // Step 4: Complete
        setCurrentStep(3);
        updateStepCompletion(3, true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          router.replace('/(tabs)/profile');
        }, 2000);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during generation';
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    setGenerationSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed } : step
    ));
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleRetry = () => {
    setError(null);
    setCurrentStep(0);
    setGenerationSteps(steps.map(step => ({ ...step, completed: false })));
    startGeneration();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Generation',
      'Are you sure you want to cancel the photo generation?',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Generating Your Photos</Text>
          <Text style={globalStyles.body}>
            Creating professional photos with {modelName} in {style.replace('_', ' ')} style
          </Text>
        </View>

        {/* Progress Steps */}
        <Card style={styles.progressCard}>
          <View style={styles.stepsList}>
            {generationSteps.map((step, index) => (
              <View key={step.id} style={styles.stepContainer}>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepCircle,
                    step.completed && styles.completedStep,
                    index === currentStep && !step.completed && styles.activeStep
                  ]}>
                    {step.completed ? (
                      <MaterialIcons name="check" size={20} color={theme.colors.white} />
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        index === currentStep && styles.activeStepNumber
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < generationSteps.length - 1 && (
                    <View style={[
                      styles.stepConnector,
                      step.completed && styles.completedConnector
                    ]} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    step.completed && styles.completedStepTitle,
                    index === currentStep && !step.completed && styles.activeStepTitle
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDescription}>
                    {step.description}
                  </Text>
                  {index === currentStep && !step.completed && (
                    <View style={styles.loadingIndicator}>
                      <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
                        <MaterialIcons name="hourglass-empty" size={16} color={theme.colors.accent} />
                      </Animated.View>
                      <Animated.Text style={styles.loadingText}>
                        Processing
                        <Animated.Text>
                          {dotsAnim.interpolate({
                            inputRange: [0, 1, 2, 3],
                            outputRange: ['', '.', '..', '...'],
                            extrapolate: 'clamp',
                          })}
                        </Animated.Text>
                      </Animated.Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Error State */}
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <MaterialIcons name="error" size={24} color={theme.colors.error} />
              <Text style={styles.errorTitle}>Generation Failed</Text>
            </View>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.errorActions}>
              <Button
                title="Try Again"
                onPress={handleRetry}
                variant="primary"
                style={styles.retryButton}
              />
              <Button
                title="Go Back"
                onPress={() => router.back()}
                variant="outline"
                style={styles.backButton}
              />
            </View>
          </Card>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color={theme.colors.accent} />
            <Text style={styles.infoTitle}>Processing Information</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoText}>• This process typically takes 2-3 minutes</Text>
            <Text style={styles.infoText}>• Your photos are processed securely</Text>
            <Text style={styles.infoText}>• You'll get 3 professional photos</Text>
            <Text style={styles.infoText}>• You can regenerate if needed</Text>
          </View>
        </Card>

        {/* Cancel Button */}
        {isGenerating && !error && (
          <View style={styles.cancelSection}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              size="large"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  progressCard: {
    marginBottom: theme.spacing.lg,
  },
  stepsList: {
    gap: theme.spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  activeStep: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.accent,
  },
  completedStep: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  stepNumber: {
    ...globalStyles.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textSecondary,
  },
  activeStepNumber: {
    color: theme.colors.accent,
  },
  stepConnector: {
    width: 2,
    height: 32,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  completedConnector: {
    backgroundColor: theme.colors.accent,
  },
  stepContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  stepTitle: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  activeStepTitle: {
    color: theme.colors.accent,
  },
  completedStepTitle: {
    color: theme.colors.success,
  },
  stepDescription: {
    ...globalStyles.caption,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...globalStyles.caption,
    color: theme.colors.accent,
    fontStyle: 'italic',
  },
  errorCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.error,
  },
  errorMessage: {
    ...globalStyles.caption,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  retryButton: {
    flex: 1,
  },
  backButton: {
    flex: 1,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
  },
  infoList: {
    gap: theme.spacing.sm,
  },
  infoText: {
    ...globalStyles.caption,
    lineHeight: 20,
  },
  cancelSection: {
    marginTop: 'auto',
    paddingBottom: theme.spacing.lg,
  },
});

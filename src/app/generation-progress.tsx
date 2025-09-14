import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Gender, StyleType } from '../types';
import googleAIService from '../services/googleAI';

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
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const startGeneration = async () => {
    if (!images || !gender || !modelName || !style) {
      setError('Missing required parameters');
      return;
    }

    setIsGenerating(true);
    const imageList = JSON.parse(images);

    try {
      // Step 1: Processing Images
      setCurrentStep(0);
      updateStepCompletion(0, false);
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
        setGeneratedImages(result.generatedImages);
        updateStepCompletion(2, true);
        
        // Step 4: Complete
        setCurrentStep(3);
        updateStepCompletion(3, true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/profile',
            params: { 
              newPhotos: JSON.stringify(result.generatedImages),
              modelName,
              style 
            }
          });
        }, 2000);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
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
      <View style={styles.container}>
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
                      <MaterialIcons name="hourglass-empty" size={16} color={theme.colors.accent} />
                      <Text style={styles.loadingText}>Processing...</Text>
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
      </View>
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

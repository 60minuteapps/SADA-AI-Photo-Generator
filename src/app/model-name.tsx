import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Gender } from '../types';

export default function ModelNameScreen() {
  const { images, gender } = useLocalSearchParams<{ images: string; gender: Gender }>();
  const [modelName, setModelName] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleNameChange = (text: string) => {
    setModelName(text);
    // Validate name: 3-30 characters, letters, numbers, spaces, hyphens
    const isValidName = /^[a-zA-Z0-9\s-]{3,30}$/.test(text.trim());
    setIsValid(isValidName);
  };

  const handleContinue = () => {
    if (isValid && images && gender) {
      router.push({
        pathname: '/style-selection',
        params: { 
          images,
          gender,
          modelName: modelName.trim()
        }
      });
    }
  };

  const suggestedNames = [
    'Professional Me',
    'Business Portrait',
    'LinkedIn Profile',
    'Executive Style',
    'Corporate Look'
  ];

  return (
    <View style={globalStyles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={globalStyles.title}>Name Your AI Model</Text>
            <Text style={globalStyles.body}>
              Give your AI model a memorable name that you'll recognize later
            </Text>
          </View>

          {/* Input Section */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Model Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  !isValid && modelName.length > 0 && styles.invalidInput
                ]}
                value={modelName}
                onChangeText={handleNameChange}
                placeholder="Enter a name for your AI model"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <View style={styles.inputFooter}>
                <Text style={[
                  styles.validationText,
                  !isValid && modelName.length > 0 && styles.errorText
                ]}>
                  {modelName.length === 0 
                    ? '3-30 characters, letters and numbers only'
                    : isValid 
                      ? '✓ Valid name'
                      : 'Invalid: Use 3-30 characters, letters, numbers, spaces, and hyphens only'
                  }
                </Text>
                <Text style={styles.characterCount}>
                  {modelName.length}/30
                </Text>
              </View>
            </View>
          </Card>

          {/* Suggestions */}
          <Card style={styles.suggestionsCard}>
            <Text style={styles.suggestionsTitle}>Suggested Names</Text>
            <View style={styles.suggestionsList}>
              {suggestedNames.map((suggestion, index) => (
                <Button
                  key={index}
                  title={suggestion}
                  onPress={() => handleNameChange(suggestion)}
                  variant="outline"
                  size="small"
                  style={styles.suggestionButton}
                />
              ))}
            </View>
          </Card>

          {/* Info Section */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="lightbulb" size={24} color={theme.colors.accent} />
              <Text style={styles.infoTitle}>Naming Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>• Choose something you'll remember</Text>
              <Text style={styles.tip}>• Describe the purpose (e.g., "LinkedIn Profile")</Text>
              <Text style={styles.tip}>• Keep it professional and clear</Text>
              <Text style={styles.tip}>• You can always change it later</Text>
            </View>
          </Card>

          {/* Continue Button */}
          <View style={styles.continueSection}>
            <Button
              title="Continue"
              onPress={handleContinue}
              disabled={!isValid}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  inputCard: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    gap: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    minHeight: theme.touchTarget.minHeight,
  },
  invalidInput: {
    borderColor: theme.colors.error,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validationText: {
    ...globalStyles.caption,
    flex: 1,
    color: theme.colors.success,
  },
  errorText: {
    color: theme.colors.error,
  },
  characterCount: {
    ...globalStyles.caption,
    color: theme.colors.textSecondary,
  },
  suggestionsCard: {
    marginBottom: theme.spacing.lg,
  },
  suggestionsTitle: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  suggestionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
  },
  tipsList: {
    gap: theme.spacing.xs,
  },
  tip: {
    ...globalStyles.caption,
    lineHeight: 20,
  },
  continueSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
});

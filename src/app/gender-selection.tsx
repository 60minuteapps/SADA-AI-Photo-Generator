import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Gender } from '../types';

export default function GenderSelectionScreen() {
  const { images } = useLocalSearchParams<{ images: string }>();
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  const handleContinue = () => {
    if (selectedGender && images) {
      router.push({
        pathname: '/model-name',
        params: { 
          images,
          gender: selectedGender 
        }
      });
    }
  };

  const genderOptions = [
    {
      value: 'female' as Gender,
      label: 'Female',
      icon: 'woman' as const,
      description: 'Generate professional photos with female styling'
    },
    {
      value: 'male' as Gender,
      label: 'Male', 
      icon: 'man' as const,
      description: 'Generate professional photos with male styling'
    }
  ];

  return (
    <View style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Select Gender</Text>
          <Text style={globalStyles.body}>
            Choose the gender for your AI model to ensure accurate professional styling
          </Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                selectedGender === option.value && styles.selectedOption
              ]}
              onPress={() => setSelectedGender(option.value)}
              activeOpacity={0.8}
            >
              <Card style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <View style={[
                    styles.iconContainer,
                    selectedGender === option.value && styles.selectedIconContainer
                  ]}>
                    <MaterialIcons 
                      name={option.icon} 
                      size={32} 
                      color={selectedGender === option.value ? theme.colors.white : theme.colors.accent} 
                    />
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    selectedGender === option.value && styles.selectedLabel
                  ]}>
                    {option.label}
                  </Text>
                </View>
                <Text style={[
                  styles.optionDescription,
                  selectedGender === option.value && styles.selectedDescription
                ]}>
                  {option.description}
                </Text>
                
                {selectedGender === option.value && (
                  <View style={styles.selectedIndicator}>
                    <MaterialIcons name="check-circle" size={24} color={theme.colors.accent} />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Information Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color={theme.colors.accent} />
            <Text style={styles.infoTitle}>Why Gender Selection Matters</Text>
          </View>
          <Text style={styles.infoText}>
            Gender selection helps our AI model apply the appropriate professional styling, 
            clothing choices, and presentation standards that align with your preferences 
            and professional goals.
          </Text>
        </Card>

        {/* Continue Button */}
        <View style={styles.continueSection}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedGender}
            size="large"
          />
        </View>
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
  optionsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  optionCard: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: theme.colors.accent,
  },
  optionContent: {
    position: 'relative',
    margin: 0,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  selectedIconContainer: {
    backgroundColor: theme.colors.accent,
  },
  optionLabel: {
    ...globalStyles.subtitle,
    flex: 1,
  },
  selectedLabel: {
    color: theme.colors.accent,
  },
  optionDescription: {
    ...globalStyles.caption,
    marginLeft: 72,
  },
  selectedDescription: {
    color: theme.colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  infoCard: {
    marginBottom: theme.spacing.xl,
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
  infoText: {
    ...globalStyles.caption,
    lineHeight: 20,
  },
  continueSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
});

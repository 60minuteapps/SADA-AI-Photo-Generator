import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PHOTO_STYLES, getStyleExampleImage } from '../constants/data';
import { Gender, StyleType } from '../types';

export default function StyleSelectionScreen() {
  const { images, gender, modelName } = useLocalSearchParams<{ 
    images: string; 
    gender: Gender; 
    modelName: string; 
  }>();
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);

  const handleContinue = () => {
    if (selectedStyle && images && gender && modelName) {
      router.push({
        pathname: '/generation-progress',
        params: { 
          images,
          gender,
          modelName,
          style: selectedStyle
        }
      });
    }
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Choose Your Style</Text>
          <Text style={globalStyles.body}>
            Select the professional style for your AI-generated photos
          </Text>
        </View>

        {/* Model Info */}
        <Card style={styles.modelCard}>
          <View style={styles.modelInfo}>
            <MaterialIcons name="smart-toy" size={24} color={theme.colors.accent} />
            <View style={styles.modelDetails}>
              <Text style={styles.modelName}>{modelName}</Text>
              <Text style={styles.modelGender}>
                {gender === 'male' ? 'Male' : 'Female'} Model
              </Text>
            </View>
          </View>
        </Card>

        {/* Style Options */}
        <View style={styles.stylesContainer}>
          {PHOTO_STYLES.map((style) => {
            const isSelected = selectedStyle === style.name;
            const exampleImage = getStyleExampleImage(style.name, gender);
            
            return (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  isSelected && styles.selectedStyleCard
                ]}
                onPress={() => setSelectedStyle(style.name as StyleType)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.styleContent,
                  isSelected && styles.selectedStyleContent
                ]}>
                  <View style={styles.styleImageContainer}>
                    <Image 
                      source={exampleImage}
                      style={styles.styleImage}
                      contentFit="cover"
                      contentPosition="top"
                    />
                  </View>
                  
                  <View style={styles.styleInfo}>
                    <Text style={[
                      styles.styleName,
                      isSelected && styles.selectedStyleName
                    ]}>
                      {style.displayName}
                    </Text>
                    <Text style={[
                      styles.styleDescription,
                      isSelected && styles.selectedStyleDescription
                    ]}>
                      {style.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Generation Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color={theme.colors.accent} />
            <Text style={styles.infoTitle}>What Happens Next</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• AI model will be trained on your photos</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• 3 professional photos will be generated</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• Processing takes 2-3 minutes</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>• You can regenerate if needed</Text>
            </View>
          </View>
        </Card>

        {/* Continue Button */}
        <View style={styles.continueSection}>
          <Button
            title={`Generate ${selectedStyle ? PHOTO_STYLES.find(s => s.name === selectedStyle)?.displayName : 'Photos'}`}
            onPress={handleContinue}
            disabled={!selectedStyle}
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
    marginBottom: theme.spacing.lg,
  },
  modelCard: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  modelDetails: {
    flex: 1,
  },
  modelName: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent,
  },
  modelGender: {
    ...globalStyles.caption,
  },
  stylesContainer: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  styleCard: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyleCard: {
    borderColor: theme.colors.accent,
  },
  styleContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedStyleContent: {
    backgroundColor: theme.colors.background,
  },
  styleImageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  styleImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleInfo: {
    padding: theme.spacing.md,
  },
  styleName: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.xs,
  },
  selectedStyleName: {
    color: theme.colors.accent,
  },
  styleDescription: {
    ...globalStyles.caption,
  },
  selectedStyleDescription: {
    color: theme.colors.text,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    ...globalStyles.caption,
    lineHeight: 20,
  },
  continueSection: {
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
});

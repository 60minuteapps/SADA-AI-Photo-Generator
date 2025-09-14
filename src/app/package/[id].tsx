import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme, globalStyles } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PACKAGES, getStyleExampleImage } from '../../constants/data';

export default function PackageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const packageData = PACKAGES.find(pkg => pkg.id === id);

  if (!packageData) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.errorContainer}>
          <Text style={globalStyles.title}>Package not found</Text>
        </View>
      </View>
    );
  }

  const handleGetStarted = () => {
    router.push('/photo-picker');
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Package Header */}
        <Card style={styles.headerCard}>
          <View style={styles.packageHeader}>
            <Image 
              source={packageData.previewImage} 
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.packageInfo}>
              <Text style={globalStyles.title}>{packageData.name}</Text>
              <Text style={globalStyles.body}>{packageData.description}</Text>
              <View style={styles.packageStats}>
                <View style={styles.stat}>
                  <MaterialIcons name="photo-library" size={20} color={theme.colors.accent} />
                  <Text style={styles.statText}>{packageData.styles.length} Styles</Text>
                </View>
                <View style={styles.stat}>
                  <MaterialIcons name="high-quality" size={20} color={theme.colors.accent} />
                  <Text style={styles.statText}>4K Quality</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Style Preview Section */}
        <Card style={styles.stylesCard}>
          <Text style={globalStyles.subtitle}>Professional Styles</Text>
          <Text style={styles.stylesDescription}>
            Preview the different professional styles available in this package
          </Text>
          
          <View style={styles.stylesGrid}>
            {packageData.styles.map((style) => (
              <View key={style.id} style={styles.styleCard}>
                <View style={styles.styleImages}>
                  <Image 
                    source={getStyleExampleImage(style.name, 'female')}
                    style={styles.styleImage}
                    contentFit="cover"
                  />
                  <Image 
                    source={getStyleExampleImage(style.name, 'male')}
                    style={styles.styleImage}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.styleInfo}>
                  <Text style={styles.styleName}>{style.displayName}</Text>
                  <Text style={styles.styleDescription}>{style.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Features Section */}
        <Card style={styles.featuresCard}>
          <Text style={globalStyles.subtitle}>What You Get</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="smart-toy" size={24} color={theme.colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Custom AI Model</Text>
                <Text style={styles.featureDescription}>
                  Trained specifically on your photos for authentic results
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="photo-camera" size={24} color={theme.colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Multiple Generations</Text>
                <Text style={styles.featureDescription}>
                  3 unique photos per style with regeneration options
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="high-quality" size={24} color={theme.colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Professional Quality</Text>
                <Text style={styles.featureDescription}>
                  4K ultra-high resolution with studio-grade lighting
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="business" size={24} color={theme.colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>LinkedIn Optimized</Text>
                <Text style={styles.featureDescription}>
                  Perfect for professional profiles and business use
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Process Overview */}
        <Card style={styles.processCard}>
          <Text style={globalStyles.subtitle}>Simple Process</Text>
          <View style={styles.processList}>
            <View style={styles.processStep}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.processText}>Upload 3 high-quality photos</Text>
            </View>
            
            <View style={styles.processStep}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.processText}>Configure gender and model name</Text>
            </View>
            
            <View style={styles.processStep}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.processText}>Choose your preferred style</Text>
            </View>
            
            <View style={styles.processStep}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.processText}>Generate professional photos</Text>
            </View>
          </View>
        </Card>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
  },
  packageHeader: {
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  packageInfo: {
    width: '100%',
  },
  packageStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    ...globalStyles.caption,
    color: theme.colors.accent,
    fontFamily: theme.fonts.medium,
  },
  stylesCard: {
    marginBottom: theme.spacing.lg,
  },
  stylesDescription: {
    ...globalStyles.caption,
    marginBottom: theme.spacing.lg,
  },
  stylesGrid: {
    gap: theme.spacing.lg,
  },
  styleCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  styleImages: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  styleImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  styleDescription: {
    ...globalStyles.caption,
  },
  featuresCard: {
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    gap: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...globalStyles.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    ...globalStyles.caption,
  },
  processCard: {
    marginBottom: theme.spacing.lg,
  },
  processList: {
    gap: theme.spacing.md,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  processText: {
    ...globalStyles.body,
    flex: 1,
  },
  actionSection: {
    marginBottom: theme.spacing.xl,
  },
});

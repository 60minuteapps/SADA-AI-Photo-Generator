import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme, globalStyles } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { PACKAGES } from '../../constants/data';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  const handlePackagePress = (packageId: string) => {
    router.push(`/package/${packageId}`);
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Photo Packages</Text>
          <Text style={globalStyles.body}>
            Choose a professional photo package to get started
          </Text>
        </View>

        {/* Package Cards */}
        <View style={styles.packagesContainer}>
          {PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => handlePackagePress(pkg.id)}
              activeOpacity={0.8}
            >
              <Card style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Image 
                    source={pkg.previewImage} 
                    style={styles.packageImage}
                    contentFit="cover"
                  />
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                    <View style={styles.styleCount}>
                      <MaterialIcons name="photo-library" size={16} color={theme.colors.accent} />
                      <Text style={styles.styleCountText}>
                        {pkg.styles.length} Professional Styles
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.packageFooter}>
                  <View style={styles.stylePreview}>
                    {pkg.styles.slice(0, 4).map((style, index) => (
                      <View key={style.id} style={styles.styleTag}>
                        <Text style={styles.styleTagText}>{style.displayName}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.packageAction}>
                    <Text style={styles.actionText}>Get Started</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={theme.colors.accent} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Section */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's Included</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="smart-toy" size={24} color={theme.colors.accent} />
              <Text style={styles.featureText}>Custom AI model training</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="photo-camera" size={24} color={theme.colors.accent} />
              <Text style={styles.featureText}>3 photos per style generation</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="high-quality" size={24} color={theme.colors.accent} />
              <Text style={styles.featureText}>4K ultra-high resolution</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="business" size={24} color={theme.colors.accent} />
              <Text style={styles.featureText}>LinkedIn optimized</Text>
            </View>
          </View>
        </Card>

        {/* Getting Started Guide */}
        <Card style={styles.guideCard}>
          <Text style={styles.guideTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Upload 3 high-quality photos</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Configure your AI model</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Choose your professional style</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Generate professional photos</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  packagesContainer: {
    marginBottom: theme.spacing.xl,
  },
  packageCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  packageHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  packageImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.xs,
  },
  packageDescription: {
    ...globalStyles.caption,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  styleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  styleCountText: {
    ...globalStyles.caption,
    color: theme.colors.accent,
    fontFamily: theme.fonts.medium,
  },
  packageFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  stylePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  styleTag: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  styleTagText: {
    ...globalStyles.caption,
    fontSize: 12,
  },
  packageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    ...globalStyles.body,
    color: theme.colors.accent,
    fontFamily: theme.fonts.medium,
  },
  featuresCard: {
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  featuresList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureText: {
    ...globalStyles.body,
    flex: 1,
  },
  guideCard: {
    marginBottom: theme.spacing.xl,
  },
  guideTitle: {
    ...globalStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  stepsList: {
    gap: theme.spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  stepText: {
    ...globalStyles.body,
    flex: 1,
  },
});

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { SessionProvider } from '../contexts/SessionContext';

const paperTheme = {
  colors: {
    primary: theme.colors.accent,
    background: theme.colors.background,
    surface: theme.colors.card,
    text: theme.colors.text,
    onSurface: theme.colors.text,
    outline: theme.colors.border,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontFamily: theme.fonts.medium,
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="package/[id]" 
            options={{ 
              title: 'Package Details',
              headerBackTitle: 'Back',
            }} 
          />
          <Stack.Screen 
            name="photo-picker" 
            options={{ title: 'Select Photos' }} 
          />
          <Stack.Screen 
            name="gender-selection" 
            options={{ title: 'Select Gender' }} 
          />
          <Stack.Screen 
            name="model-name" 
            options={{ title: 'Name Your Model' }} 
          />
          <Stack.Screen 
            name="style-selection" 
            options={{ title: 'Choose Style' }} 
          />
          <Stack.Screen 
            name="generation-progress" 
            options={{ 
              title: 'Generating Photos',
              headerBackVisible: false,
            }} 
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

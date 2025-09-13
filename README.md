# SADA - AI Photo Generator

A React Native mobile application that generates professional AI-powered profile photos optimized for LinkedIn and business use.

## 📱 Overview

SADA allows users to upload personal photos to train a custom AI model, then generate styled portraits across multiple professional themes. Perfect for creating LinkedIn profile photos and other business-related imagery.

## ✨ Features

- **AI Model Training**: Custom model creation from 3 user photos
- **Professional Styles**: 4 distinct business-appropriate photo styles
- **LinkedIn Optimized**: Specifically designed for professional networking
- **Quality Control**: Regeneration options for unsatisfactory results
- **Profile Management**: Centralized view of all generated content

## 🎨 Available Styles

### Business for LinkedIn Package
- **Suit** - Formal business attire
- **Street Casual** - Smart casual professional look  
- **Office** - Modern workplace appropriate
- **Business** - Corporate executive style

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native with TypeScript
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **Runtime**: Expo

### Backend
- **Database & Auth**: Supabase
- **AI Integration**: Google AI Studio API
- **Prompting System**: Nano Banana (JSON-based)

## 📱 App Screens

1. **My Profile** - Central hub for AI model and generated photos
2. **Explore** - Package discovery and selection
3. **Package Preview** - Detailed package information
4. **Photo Upload** - Camera/gallery integration for training images
5. **Gender Selection** - AI model configuration
6. **Model Naming** - Personalize your AI model
7. **Style Selection** - Choose from available professional styles

## 🚀 User Journey

1. Browse and select "Business for LinkedIn" package
2. Upload 3 high-quality training photos
3. Configure AI model (gender, name)
4. Choose desired professional style
5. Generate 3 professional photos
6. Review and select favorites
7. Access generated photos in profile

## 🎨 Design System

- **Primary Background**: `#0d1b2a`
- **Text Color**: `#e0e1dd`
- **Typography**: Helvetica
- **Theme**: Professional dark theme with high contrast
- **Layout**: Card-based design optimized for mobile

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SADA-AI-Photo-Generator.git
cd SADA-AI-Photo-Generator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase and Google AI Studio API keys
```

4. Start the development server:
```bash
npx expo start
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_key
```

## 📱 Development

### Running on iOS
```bash
npx expo start --ios
```

### Running on Android
```bash
npx expo start --android
```

### Running on Web
```bash
npx expo start --web
```

## 🏗 Project Structure

```
src/
├── app/                 # Expo Router screens
├── components/          # Reusable UI components
├── constants/           # App constants and configuration
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
└── types/              # TypeScript type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI Studio for AI image generation
- Supabase for backend infrastructure
- Expo team for the excellent development platform
- React Native Paper for UI components

## 📞 Support

For support, email support@sada-app.com or create an issue in this repository.

---

Made with ❤️ for professional photo generation

# SADA - AI Photo Generator

## Project Overview
SADA is a React Native mobile application that generates professional AI-powered profile photos optimized for LinkedIn and business use. Users upload personal photos to train a custom AI model, then generate styled portraits across multiple professional themes.

## Technical Stack

### Frontend
- **Framework**: React Native with TypeScript
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **Runtime**: Expo

### Backend
- **Database & Auth**: Supabase
- **AI Integration**: Google AI Studio API
- **Prompting System**: Nano Banana (JSON-based)

## Design System

### Color Palette
- **Primary Background**: `#0d1b2a`
- **Text Color**: `#e0e1dd`
- **Typography**: Helvetica

### Visual Style
- Professional, clean interface optimized for business users
- Dark theme with high contrast for accessibility
- Card-based layouts for package presentation

## Photo Generation Packages

### Business for LinkedIn Package
**Included Styles:**
- **Suit** - Formal business attire
- **Street Casual** - Smart casual professional look
- **Office** - Modern workplace appropriate
- **Business** - Corporate executive style

*Note: Only the Business for LinkedIn package is implemented - no additional placeholder packages required*

## Application Screens

### 1. My Profile Screen
**Purpose**: Central hub for user's AI model and generated content
**Components:**
- Upload interface for 3 training images
- Gallery display of uploaded source images
- Showcase of all generated profile photos
- User's AI model information

### 2. Explore Screen
**Purpose**: Package discovery and selection
**Components:**
- Photo generation packages displayed as interactive cards
- Horizontal scrolling carousel featuring Business for LinkedIn package
- Package preview thumbnails

### 3. Package Screen
**Purpose**: Detailed package preview
**Components:**
- Sneak peek of package content
- Style examples and descriptions
- Package selection confirmation

### 4. Photo Image Picker Screen
**Purpose**: Image upload and selection interface
**Components:**
- Camera integration for new photos
- Gallery access for existing photos
- Selected images preview (3 required)
- Upload progress indicators

### 5. Pick Gender Screen
**Purpose**: AI model gender configuration
**Components:**
- Male/Female selection options
- Clear visual indicators
- Confirmation flow

### 6. AI Model Name Screen
**Purpose**: Personalization of AI model
**Components:**
- Text input for custom model name
- Name validation
- Save functionality

### 7. Choose Style Screen
**Purpose**: Style selection from package
**Components:**
- 4 style cards with visual examples
- Style descriptions
- Selection confirmation

## Application Flow

### Complete User Journey
1. **Package Selection** → User browses and selects "Business for LinkedIn" package in Explore screen
2. **Package Preview** → Review sneak peek of package content and styles
3. **Photo Upload** → Upload or select 3 high-quality photos for AI training
4. **Gender Selection** → Configure AI model gender (Male/Female)
5. **Model Naming** → Assign custom name to AI model
6. **Style Selection** → Choose from 4 available styles (Suit, Street Casual, Office, Business)
7. **Generation Process** → AI generates 3 professional photos in selected style
8. **Review & Selection** → Choose favorite generated images or request regeneration
9. **Profile Update** → Redirect to My Profile screen with new generated content

## AI Integration Specifications

### Training Requirements
- **Input**: 3 high-quality user photos
- **Output**: Professional-style portraits
- **Styles**: 4 distinct professional themes per package
- **Generation Count**: 3 images per style selection

### API Integration
- **Provider**: Google AI Studio API
- **Prompting**: Nano Banana JSON-based system
- **Processing**: Asynchronous generation with progress tracking

## Key Features

### Core Functionality
- **AI Model Training**: Custom model creation from user photos
- **Multi-Style Generation**: 4 professional photo styles
- **Quality Control**: Regeneration options for unsatisfactory results
- **Profile Management**: Centralized view of all generated content

### User Experience
- **Intuitive Flow**: Step-by-step guided process
- **Professional Focus**: LinkedIn-optimized output
- **Quick Generation**: Efficient AI processing
- **Easy Management**: Simple photo organization and selection

## Data Requirements

### User Data
- Profile information
- Uploaded training images
- Generated photo gallery
- AI model configurations

### Session Data
- Package selection state
- Upload progress
- Generation status
- User preferences


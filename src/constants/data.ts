import { PhotoPackage, PhotoStyle } from '../types';

export const PHOTO_STYLES: PhotoStyle[] = [
  {
    id: 'business_suit',
    name: 'business_suit',
    displayName: 'Business Suit',
    description: 'Formal business attire for executive presence',
    exampleImage: require('../../assets/ai_model_imgs/female_business_suit.png'),
    promptKey: 'business_suit',
  },
  {
    id: 'office_professional',
    name: 'office_professional',
    displayName: 'Office Professional',
    description: 'Modern workplace appropriate styling',
    exampleImage: require('../../assets/ai_model_imgs/female_office_professional.png'),
    promptKey: 'office_professional',
  },
  {
    id: 'street_casual',
    name: 'street_casual',
    displayName: 'Street Casual',
    description: 'Smart casual professional look',
    exampleImage: require('../../assets/ai_model_imgs/female_street_casual.png'),
    promptKey: 'street_casual',
  },
  {
    id: 'business_casual',
    name: 'business_casual',
    displayName: 'Business Casual',
    description: 'Corporate executive style',
    exampleImage: require('../../assets/ai_model_imgs/female_business_casual.png'),
    promptKey: 'business_casual',
  },
];

export const BUSINESS_LINKEDIN_PACKAGE: PhotoPackage = {
  id: 'business_linkedin',
  name: 'Business for LinkedIn',
  description: 'Professional AI-powered profile photos optimized for LinkedIn and business use',
  styles: PHOTO_STYLES,
  previewImage: require('../../assets/ai_model_imgs/female_business_suit.png'),
};

export const PACKAGES: PhotoPackage[] = [BUSINESS_LINKEDIN_PACKAGE];

export const getStyleExampleImage = (styleName: string, gender: 'male' | 'female') => {
  const imageMap = {
    male: {
      business_suit: require('../../assets/ai_model_imgs/male_business_suit.png'),
      office_professional: require('../../assets/ai_model_imgs/male_office_professional.png'),
      street_casual: require('../../assets/ai_model_imgs/male_street_casual.png'),
      business_casual: require('../../assets/ai_model_imgs/male_business_casual.png'),
    },
    female: {
      business_suit: require('../../assets/ai_model_imgs/female_business_suit.png'),
      office_professional: require('../../assets/ai_model_imgs/female_office_professional.png'),
      street_casual: require('../../assets/ai_model_imgs/female_street_casual.png'),
      business_casual: require('../../assets/ai_model_imgs/female_business_casual.png'),
    },
  };

  return imageMap[gender][styleName as keyof typeof imageMap.male];
};

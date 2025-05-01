import Constants from 'expo-constants';

// Get API key from Expo's environment variables
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;

if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set in app.config.js');
}

export const config = {
  openaiApiKey: OPENAI_API_KEY
}; 
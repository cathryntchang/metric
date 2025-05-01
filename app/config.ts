import Constants from 'expo-constants';

// Get API key from Expo's environment variables
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in app.config.js');
}

export const config = {
  openaiApiKey: OPENAI_API_KEY || "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"
}; 
import 'dotenv/config';

export default {
  name: "metric",
  slug: "metric",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    openaiApiKey: "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"
  }
}; 
const { expo } = require('./buyer/app.json');

// The combined AgentMart app can be launched directly from frontend/.
// Its existing source and assets stay in buyer/ to preserve existing scripts.
module.exports = {
  ...expo,
  icon: './buyer/assets/icon.png',
  plugins: [['expo-router', { root: './buyer/src/app' }], 'expo-font', 'expo-secure-store'],
  android: {
    ...expo.android,
    adaptiveIcon: {
      ...expo.android.adaptiveIcon,
      foregroundImage: './buyer/assets/android-icon-foreground.png',
      backgroundImage: './buyer/assets/android-icon-background.png',
      monochromeImage: './buyer/assets/android-icon-monochrome.png',
    },
  },
  web: { ...expo.web, favicon: './buyer/assets/favicon.png' },
};

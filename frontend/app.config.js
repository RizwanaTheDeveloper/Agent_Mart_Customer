const { expo } = require('./buyer/app.json');

// The combined AgentMart app can be launched directly from frontend/.
// Its existing source and assets stay in buyer/ to preserve existing scripts.
module.exports = {
  ...expo,
  extra: {
    ...expo.extra,
    eas: {
      ...expo.extra?.eas,
      projectId: '057c0221-222a-4711-8470-9036e8a64235',
    },
  },
  icon: './buyer/assets/icon.png',
  plugins: [['expo-router', { root: './buyer/src/app' }], 'expo-font', 'expo-secure-store'],
  android: {
    ...expo.android,
    package: expo.android?.package || 'com.agentmart.app',
    adaptiveIcon: {
      ...expo.android.adaptiveIcon,
      foregroundImage: './buyer/assets/android-icon-foreground.png',
      backgroundImage: './buyer/assets/android-icon-background.png',
      monochromeImage: './buyer/assets/android-icon-monochrome.png',
    },
  },
  web: { ...expo.web, favicon: './buyer/assets/favicon.png' },
};

import { StyleSheet, Text, type TextProps } from 'react-native';
import { fonts } from './theme';

/** Match the web brand fonts while retaining text scaling and accessibility. */
export function AppText({ style, ...props }: TextProps) {
  const resolved = StyleSheet.flatten(style);
  const weight = resolved?.fontWeight === 'bold' ? 700 : Number(resolved?.fontWeight || 400);
  const heading = props.accessibilityRole === 'header' || (resolved?.fontSize || 0) >= 20;
  const fontFamily = heading ? (weight >= 800 ? fonts.headingBold : fonts.heading)
    : weight >= 700 ? fonts.bold : weight >= 500 ? fonts.semibold : fonts.regular;
  return <Text {...props} style={[style, { fontFamily, fontWeight: 'normal' }]} />;
}

import { Text } from 'react-native';
import ScreenContainer from './ScreenContainer';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function FeaturePlaceholder({ title }: { title: string }) {
  return <ScreenContainer variant="reading" centered>
    <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>{title}</Text>
    <Text style={[typography.body, { color: colors.muted }]}>This feature is being prepared. Check back soon.</Text>
  </ScreenContainer>;
}

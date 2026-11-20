import { Text } from 'react-native';
import { colors } from '../../theme/colors';
export default function ErrorMessage({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 16 }}>{message}</Text>;
}

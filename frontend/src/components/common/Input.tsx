import { useId } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';

type Props = TextInputProps & { label: string; error?: string };
export default function Input({ label, error, style, ...props }: Props) {
  const id = useId();
  return <View style={{ gap: 8, minWidth: 0, width: '100%' }}>
    <Text nativeID={`${id}-label`} style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>{label}</Text>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} accessibilityLabelledBy={`${id}-label`} placeholderTextColor={colors.muted}
      style={[{ minHeight: 48, borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, backgroundColor: colors.surface, width: '100%' }, style]} />
    {error && <Text accessibilityRole="alert" style={{ fontSize: 14, color: colors.danger }}>{error}</Text>}
  </View>;
}

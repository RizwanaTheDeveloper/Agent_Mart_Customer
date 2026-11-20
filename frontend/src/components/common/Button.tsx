import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { colors } from '../../theme/colors';

type Props = Omit<PressableProps, 'children'> & { title: string; loading?: boolean };
export default function Button({ title, loading = false, disabled, style, ...props }: Props) {
  return <Pressable {...props} accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading}
    style={state => [{ minHeight: 48, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: disabled || loading ? 0.5 : state.pressed ? 0.8 : 1 }, typeof style === 'function' ? style(state) : style]}>
    {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{title}</Text>}
  </Pressable>;
}

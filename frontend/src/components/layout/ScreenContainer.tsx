import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/colors';
import { contentWidths } from '../../theme/spacing';

type Props = {
  children: ReactNode;
  variant?: keyof typeof contentWidths;
  scroll?: boolean;
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function ScreenContainer({ children, variant = 'wide', scroll = true, centered = false, contentStyle }: Props) {
  const { gutter } = useResponsive();
  const headerHeight = useHeaderHeight();
  // The navigator already reserves the top safe area for visible headers.
  const edges: Edge[] = headerHeight > 0 ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom'];
  const content = <View style={[styles.content, { maxWidth: contentWidths[variant], padding: gutter }, centered && styles.centered, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={styles.container}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
        {scroll ? <ScrollView style={styles.fill} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{content}</ScrollView> : content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { width: '100%', alignSelf: 'center', flexGrow: 1, gap: 16 },
  centered: { justifyContent: 'center' },
});

import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header, ResponsiveGrid, ScreenContainer } from '../components/layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

/** A review screen for layout behavior; does not submit data or authenticate. */
export default function ResponsivePreview() {
  const { isMobile, isTablet } = useResponsive();
  const [query, setQuery] = useState('');
  return <ScreenContainer>
    <Header title="AgentMart layout preview" />
    <Text style={[typography.body, { color: colors.muted }]}>
      {isMobile ? 'Phone' : isTablet ? 'Tablet' : 'Desktop'} layout. Resize the window or rotate your device to review spacing and columns.
    </Text>
    <ResponsiveGrid>
      {['Find properties', 'Manage inventory', 'Your firm'].map(title => <View key={title} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 24, gap: 12, flex: 1 }}>
        <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.body, { color: colors.muted }]}>Cards stack on phones and arrange into columns on larger screens.</Text>
      </View>)}
    </ResponsiveGrid>
    <View style={{ width: '100%', maxWidth: 560, gap: 16, paddingVertical: 24 }}>
      <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>Form preview</Text>
      <Input label="Location" placeholder="Enter a city or area" value={query} onChangeText={setQuery} />
      <Text style={[typography.caption, { color: colors.muted }]}>Preview only. Use this field to check the keyboard and touch target size.</Text>
      <Button title="Open buyer navigation" onPress={() => router.push('/dashboard')} />
      <Button title="Open seller navigation" onPress={() => router.push('/(seller)')} />
    </View>
  </ScreenContainer>;
}

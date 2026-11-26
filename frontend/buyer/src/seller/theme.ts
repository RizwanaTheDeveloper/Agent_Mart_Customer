import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 14, paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderColor: '#dde1e6', backgroundColor: '#fff' },
  brand: { flex: 1, minWidth: 120, color: '#273749', fontSize: 18, fontWeight: '700' },
  button: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  buttonText: { color: '#273749', fontSize: 14, fontWeight: '600' },
  preview: { padding: 10, backgroundColor: '#e2e8ee' },
  previewText: { color: '#4c5764', fontSize: 13, lineHeight: 19 },
  content: { flex: 1, position: 'relative' },
  loading: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#f6f7f8' },
  error: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 18 },
  title: { color: '#273749', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  text: { color: '#636c76', fontSize: 16, lineHeight: 24, textAlign: 'center' },
});

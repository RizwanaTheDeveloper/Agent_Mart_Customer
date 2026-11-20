import { Children, type ReactNode } from 'react';
import { View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

/** Each column gets an equal share of its parent's available width. */
export default function ResponsiveGrid({ children, maxColumns = 3 }: { children: ReactNode; maxColumns?: 1 | 2 | 3 }) {
  const { columns, fontScale } = useResponsive();
  const count = fontScale > 1.5 ? 1 : Math.min(columns, maxColumns);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
    {Children.toArray(children).map((child, index) => <View key={index} style={{ width: `${100 / count}%`, padding: 8, minWidth: 0 }}>{child}</View>)}
  </View>;
}

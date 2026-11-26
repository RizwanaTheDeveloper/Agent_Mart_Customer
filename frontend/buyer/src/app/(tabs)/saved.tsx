import { ActivityIndicator } from 'react-native';
import { Empty, Intro, PropertyGrid, Screen } from '../../components';
import { useBuyer } from '../../state';
import { colors } from '../../theme';

export default function Saved() { const store = useBuyer(); const properties = store.listings.filter(p => store.saved.includes(p.id)); return <Screen><Intro title="Your favourites, all together." subtitle="A little closer to finding the right place." />{!store.ready ? <ActivityIndicator color={colors.green} /> : properties.length ? <PropertyGrid properties={properties} /> : <Empty title="Your shortlist starts here." message="Tap the heart on a property to keep it here." />}</Screen>; }

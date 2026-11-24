import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText as Text } from '../../AppText';
import { Empty, Intro, Screen } from '../../components';
import { listings } from '../../data/listings';
import { useBuyer } from '../../state';
import { colors, styles as s } from '../../theme';

export default function Drafts() { const store = useBuyer(); return <Screen><Intro title="Keep the conversation in mind." subtitle="Your private questions for future seller conversations. Drafts have not been sent." />{store.drafts.length ? store.drafts.map(d => { const p = listings.find(p => p.id === d.propertyId)!; return <View key={d.id} style={s.panel}><View style={s.between}><Text style={s.eyebrow}>LOCAL DRAFT · NOT SENT</Text><Pressable accessibilityRole="button" accessibilityLabel={`Delete draft for ${p.title}`} onPress={() => store.deleteDraft(d.id)} style={{ padding: 10 }}><Ionicons name="trash-outline" size={21} color={colors.green} /></Pressable></View><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/property/[id]', params: { id: p.id } })}><Text style={s.heading}>{p.title}</Text></Pressable><Text style={s.subtitle}>{d.message}</Text><Text style={s.location}>Saved {new Date(d.created).toLocaleDateString('en-IN')}</Text></View>; }) : <Empty title="Make a note for your next move." message="Open a property and save your questions as an enquiry draft." />}</Screen>; }

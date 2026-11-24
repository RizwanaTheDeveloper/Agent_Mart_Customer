import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { AppText as Text } from '../../../AppText';
import { Empty, Primary, PropertyArt, Screen, money } from '../../../components';
import { listings } from '../../../data/listings';
import { useBuyer } from '../../../state';
import { colors, styles as s } from '../../../theme';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(), store = useBuyer();
  const [message, setMessage] = useState('');
  const p = listings.find(p => p.id === id);
  if (!p) return <Screen><Empty title="Property not found." message="Return to Discover to explore the sample catalogue." /></Screen>;
  const saved = store.saved.includes(p.id);
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen><Text style={s.eyebrow}>FICTIONAL SAMPLE LISTING</Text><View style={{ height: 230, borderRadius: 14, overflow: 'hidden' }}><PropertyArt property={p} /></View><Text style={s.location}>{p.locality}, {p.city}</Text><Text accessibilityRole="header" style={s.title}>{p.title}</Text><View style={s.row}><Text style={s.price}>{money(p.price)}</Text>{p.purpose === 'Rent' && <Text style={s.location}>per month</Text>}</View><Text style={s.facts}>{p.type} · {p.area} {p.unit} · {p.facing} facing · For {p.purpose.toLowerCase()}</Text><Text style={s.heading}>A little more about this place</Text><Text style={s.subtitle}>{p.description}</Text><View style={{ gap: 10 }}>{p.highlights.map(text => <Text key={text} style={s.subtitle}>✓ {text}</Text>)}</View><Pressable accessibilityRole="button" accessibilityState={{ selected: saved, disabled: !store.ready }} disabled={!store.ready} onPress={() => store.save(p.id)} style={s.chip}><Text style={s.textButtonText}>{saved ? '♥ Saved to your shortlist' : '♡ Save to your shortlist'}</Text></Pressable><View style={s.panel}><Text style={s.heading}>What would you like to ask?</Text><Text style={s.subtitle}>Save a private draft for later. Seller messaging and visit booking are not connected in this preview.</Text><Text style={s.filterLabel}>Your questions</Text><TextInput accessibilityLabel="Your questions" placeholder="Ask about documents, the property or a possible visit…" placeholderTextColor={colors.muted} value={message} onChangeText={setMessage} multiline maxLength={2000} style={s.message} /><Primary label="Save enquiry draft" disabled={!store.ready || !message.trim()} onPress={() => { store.addDraft(p.id, message); setMessage(''); router.navigate('/drafts'); }} /></View><Text style={s.location}>Fictional listing for preview. Illustrations are not photographs. No availability, ownership or legal verification is implied.</Text></Screen></KeyboardAvoidingView>;
}

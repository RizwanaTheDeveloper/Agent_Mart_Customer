import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { AppText as Text } from '../../../AppText';
import { Empty, Primary, PropertyArt, Screen, money } from '../../../components';
import { useBuyer } from '../../../state';
import PropertyFacts from '../../../PropertyFacts';
import { colors, styles as s } from '../../../theme';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(), store = useBuyer();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false), [error, setError] = useState('');
  const requestId = useRef('');
  const p = store.listings.find(p => p.id === id);
  async function send() {
    if (sending || !p) return;
    setSending(true); setError('');
    requestId.current ||= `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { await store.sendEnquiry(p.id, message, requestId.current); setMessage(''); requestId.current = ''; router.navigate('/drafts'); }
    catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  if (!p) return <Screen><Empty title="Property not found." message="Return to Discover to explore available properties." /></Screen>;
  const saved = store.saved.includes(p.id);
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen><Text style={s.eyebrow}>{store.live ? 'PUBLISHED PROPERTY' : 'FICTIONAL SAMPLE LISTING'}</Text><View style={{ height: 230, borderRadius: 14, overflow: 'hidden' }}>{p.photo ? <Image source={{ uri: p.photo }} accessibilityLabel={p.title} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <PropertyArt property={p} />}</View><Text style={s.location}>{p.locality}, {p.city}</Text><Text accessibilityRole="header" style={s.title}>{p.title}</Text><View style={s.row}><Text style={s.price}>{money(p.price)}</Text>{p.purpose === 'Rent' && <Text style={s.location}>per month</Text>}</View><Text style={s.facts}>{p.type} · {p.area} {p.unit} · {p.facing} facing · For {p.purpose.toLowerCase()}</Text><PropertyFacts property={p} /><Text style={s.heading}>A little more about this place</Text><Text style={s.subtitle}>{p.description}</Text><View style={{ gap: 10 }}>{p.highlights.map(text => <Text key={text} style={s.subtitle}>✓ {text}</Text>)}</View><Pressable accessibilityRole="button" accessibilityState={{ selected: saved, disabled: !store.ready }} disabled={!store.ready} onPress={() => store.save(p.id)} style={s.chip}><Text style={s.textButtonText}>{saved ? '♥ Saved to your shortlist' : '♡ Save to your shortlist'}</Text></Pressable><View style={s.panel}><Text style={s.heading}>What would you like to ask?</Text><Text style={s.subtitle}>Save a private draft, or sign in and send an enquiry directly to the seller of a published property.</Text><Text style={s.filterLabel}>Your questions</Text><TextInput accessibilityLabel="Your questions" placeholder="Ask about documents, the property or a possible visit…" placeholderTextColor={colors.muted} value={message} onChangeText={value => { setMessage(value); requestId.current = ''; }} editable={!sending} multiline maxLength={2000} style={s.message} /><Primary label={store.live ? sending ? 'Sending...' : store.session ? 'Send enquiry to seller' : 'Sign in to send enquiry' : 'Demo enquiries cannot be sent'} disabled={!store.live || sending || !store.ready || (!!store.session && !message.trim())} onPress={() => { if (store.session) void send(); else router.push({ pathname: '/account', params: { workspace: 'buyer' } }); }} />{!!error && <Text accessibilityRole="alert" style={s.subtitle}>{error}</Text>}<Primary label="Save enquiry draft" disabled={sending || !store.ready || !message.trim()} onPress={async () => { setSending(true); setError(''); try { await store.addDraft(p.id, message); setMessage(''); router.navigate('/drafts'); } catch (e) { setError((e as Error).message); } finally { setSending(false); } }} /></View><Text style={s.location}>{store.live ? p.photo ? 'Seller-supplied photograph. Publication does not establish ownership or legal verification.' : 'Illustrations are not property photographs. Publication does not establish ownership or legal verification.' : 'Fictional listing for preview. Illustrations are not photographs. No availability, ownership or legal verification is implied.'}</Text></Screen></KeyboardAvoidingView>;
}

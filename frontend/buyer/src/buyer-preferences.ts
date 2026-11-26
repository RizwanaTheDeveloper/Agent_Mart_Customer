import AsyncStorage from '@react-native-async-storage/async-storage';

export type BuyerPreferences = { city: string; type: string; maxPrice: string };
export const preferredTypes = ['', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'];
const key = (id: string) => `agentmart-buyer-preferences-v1:${id}`;

function validate(value: BuyerPreferences) {
  if (typeof value.city !== 'string' || value.city.length > 100 || !preferredTypes.includes(value.type)) throw Error('Enter a valid city and property type.');
  if (value.maxPrice !== '' && (!/^\d+(\.\d{1,2})?$/.test(value.maxPrice) || Number(value.maxPrice) > 1_000_000_000_000)) throw Error('Budget must be a positive amount up to INR 1 trillion, or left empty.');
  return { city: value.city.trim(), type: value.type, maxPrice: value.maxPrice.trim() };
}

export async function readBuyerPreferences(id: string) {
  const raw = await AsyncStorage.getItem(key(id));
  return raw ? validate(JSON.parse(raw)) : null;
}

export async function saveBuyerPreferences(id: string, value: BuyerPreferences) {
  const validated = validate(value);
  await AsyncStorage.setItem(key(id), JSON.stringify(validated));
  return validated;
}

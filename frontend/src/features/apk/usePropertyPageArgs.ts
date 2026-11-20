import { useLocalSearchParams } from 'expo-router';

/** Translate Expo detail-route identifiers to the document's property/thread ID. */
export function usePropertyPageArgs(): Record<string, string> {
  const params = useLocalSearchParams<{
    id?: string | string[];
    propertyId?: string | string[];
    threadId?: string | string[];
  }>();
  for (const value of [params.threadId, params.propertyId, params.id]) {
    if (typeof value === 'string') return { id: value };
  }
  return {};
}

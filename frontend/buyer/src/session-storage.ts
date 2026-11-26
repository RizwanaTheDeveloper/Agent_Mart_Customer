import * as SecureStore from 'expo-secure-store';

const key = 'agentmart-buyer-session-v1';
export const sessionStorage = {
  get: () => SecureStore.getItemAsync(key),
  set: (value: string) => SecureStore.setItemAsync(key, value),
  remove: () => SecureStore.deleteItemAsync(key),
};

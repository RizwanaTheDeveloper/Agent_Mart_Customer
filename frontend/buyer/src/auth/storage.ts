import * as SecureStore from 'expo-secure-store';

const key = 'agentmart-nest-refresh-v1';
export const authStorage = {
  get: () => SecureStore.getItemAsync(key),
  set: (token: string) => SecureStore.setItemAsync(key, token),
  remove: () => SecureStore.deleteItemAsync(key),
};

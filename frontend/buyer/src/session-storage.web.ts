// Browser sessions last for the current tab. Passwords are never persisted.
const key = 'agentmart-buyer-session-v1';
export const sessionStorage = {
  get: async () => typeof window === 'undefined' ? null : window.sessionStorage.getItem(key),
  set: async (value: string) => { window.sessionStorage.setItem(key, value); },
  remove: async () => { window.sessionStorage.removeItem(key); },
};

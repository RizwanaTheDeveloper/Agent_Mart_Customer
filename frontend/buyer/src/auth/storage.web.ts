// Web refresh credentials are held by the API's HttpOnly cookie.
export const authStorage = {
  get: async (): Promise<string | null> => null,
  set: async (_token: string): Promise<void> => {},
  remove: async (): Promise<void> => {},
};

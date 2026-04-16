import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

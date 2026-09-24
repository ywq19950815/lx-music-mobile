// AsyncStorage → localStorage
const AsyncStorage = {
  async getItem(key) { return localStorage.getItem(key) },
  async setItem(key, value) { localStorage.setItem(key, value) },
  async removeItem(key) { localStorage.removeItem(key) },
  async multiGet(keys) { return keys.map(k => [k, localStorage.getItem(k)]) },
  async multiSet(pairs) { for (const [k, v] of pairs) localStorage.setItem(k, v) },
  async multiRemove(keys) { for (const k of keys) localStorage.removeItem(k) },
  async getAllKeys() { return Object.keys(localStorage) },
  async clear() { localStorage.clear() },
}
export default AsyncStorage
export function useAsyncStorage(key) {
  return {
    async getItem() { return AsyncStorage.getItem(key) },
    async setItem(v) { return AsyncStorage.setItem(key, v) },
    async removeItem() { return AsyncStorage.removeItem(key) },
  }
}

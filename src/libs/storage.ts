import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tiny, safe JSON helpers around AsyncStorage used for caching data so the
 * app works offline-first (profiles, feed snapshot, pending writes).
 */

const CACHE_PREFIX = "zoe.cache";

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}.${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn("cache write failed", key, err);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}.${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}.${key}`);
  } catch {
    /* noop */
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
  } catch {
    /* noop */
  }
}

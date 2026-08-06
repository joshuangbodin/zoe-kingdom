import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline-first write queue.
 *
 * When the device is offline, user actions (creating/liking/commenting on
 * posts, deleting a post, updating a profile) are persisted here instead of
 * being dropped. As soon as connectivity returns they are replayed in order.
 */

const QUEUE_KEY = "zoe.offline.queue";

export type OfflineOpType =
  | "create_post"
  | "like_post"
  | "unlike_post"
  | "create_comment"
  | "update_post"
  | "delete_post"
  | "update_profile";

export type OfflineOp = {
  id: string;
  type: OfflineOpType;
  payload: Record<string, any>;
  createdAt: number;
};

export async function getQueue(): Promise<OfflineOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineOp[]) : [];
  } catch {
    return [];
  }
}

export async function enqueueOp(
  op: Omit<OfflineOp, "id" | "createdAt">,
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function replaceQueue(queue: OfflineOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function queueLength(): Promise<number> {
  return (await getQueue()).length;
}

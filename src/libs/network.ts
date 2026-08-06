import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Real-time connectivity hook backed by @react-native-community/netinfo.
 * Returns true when the device has a reachable internet connection.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online =
        !!state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
    });

    return unsub;
  }, []);

  return isOnline;
}

/** One-shot check of current connectivity. */
export async function isOnlineNow(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch {
    // If we cannot determine connectivity, assume online so writes proceed
    // and let Firestore's offline queue absorb any transient failures.
    return true;
  }
}

export type LevelUpPayload = { level: number; totalXP: number };
type Listener = (payload: LevelUpPayload) => void;
const listeners = new Set<Listener>();

export const onLevelUp = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const emitLevelUp = (payload: LevelUpPayload) => {
  listeners.forEach((fn) => fn(payload));
};

import { UserProfile } from "@/libs/firebase/users";
import { Habit } from "@/libs/sqlite/habits";
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type UserType = {
  id?: string;
  email?: string;
  xp?: number;
  level?: number;
  streak?: number;
};

type PostType = {
  id: string;
  text: string;
  likesCount?: number;
};

type AppContextType = {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;

  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;

  posts: PostType[];
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>;
};

const AppContext = createContext<AppContextType | null>(null);

type ProviderProps = {
  children: ReactNode;
};

export default function AppProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [habits, setHabits] = useState<Habit[]>([]);

  const [posts, setPosts] = useState<PostType[]>([]);

  const value = useMemo(
    () => ({
      user,
      setUser,

      habits,
      setHabits,

      posts,
      setPosts,
    }),
    [user, habits, posts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
};

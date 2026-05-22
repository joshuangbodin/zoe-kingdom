import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type UserType = {
  id?: string;
  email?: string;
  xp?: number;
  level?: number;
  streak?: number;
};

type HabitType = {
  id: string;
  title: string;
  streak: number;
};

type PostType = {
  id: string;
  text: string;
  likesCount?: number;
};

type AppContextType = {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;

  habits: HabitType[];
  setHabits: React.Dispatch<React.SetStateAction<HabitType[]>>;

  posts: PostType[];
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>;
};

const AppContext = createContext<AppContextType | null>(null);

type ProviderProps = {
  children: ReactNode;
};

export default function AppProvider({
  children,
}: ProviderProps) {
  const [user, setUser] = useState<UserType | null>(null);

  const [habits, setHabits] = useState<HabitType[]>([]);

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
    [user, habits, posts]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used inside AppProvider"
    );
  }

  return context;
};
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "./index";
import { syncUserProfile, UserProfile } from "./users";

/**
 * SIGN UP
 */
export const registerUser = async (email: string, password: string, userData: Partial<UserProfile>) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const user = cred.user;

  // create user profile in Firestore
  await syncUserProfile(user.uid, {
    email,
    userData,
  });

  return user;
};

/**
 * SIGN IN
 */
export const loginUser = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  return cred.user;
};

/**
 * SIGN OUT
 */
export const logoutUser = async () => {
  await signOut(auth);
};

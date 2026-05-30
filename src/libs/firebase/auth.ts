import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./index";
import { syncUserProfile } from "./users";

/**
 * SIGN UP
 */
export const registerUser = async (email: string, password: string , username?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const user = cred.user;

  // create user profile in Firestore


  syncUserProfile(user.uid , {email, username})
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

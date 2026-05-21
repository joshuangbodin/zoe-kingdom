import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "./index";
import { doc, setDoc } from "firebase/firestore";

/**
 * SIGN UP
 */
export const registerUser = async (
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = cred.user;

  // create user profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    createdAt: new Date().toISOString(),

    // spiritual system
    xp: 0,
    level: 1,
    streak: 0,
    spiritStage: "seed",
  });

  return user;
};

/**
 * SIGN IN
 */
export const loginUser = async (
  email: string,
  password: string
) => {
  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return cred.user;
};

/**
 * SIGN OUT
 */
export const logoutUser = async () => {
  await signOut(auth);
};
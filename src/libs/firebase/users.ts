import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./index";

export const createUserProfile = async (
  uid: string,
  data: {
    username: string;
    email: string;
  }
) => {
  await setDoc(doc(db, "users", uid), {
    uid,

    username: data.username,
    email: data.email,

    level: 1,
    xp: 0,

    spiritStage: "seed",

    streak: 0,

    bio: "",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string) => {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) return null;

  return snapshot.data();
};
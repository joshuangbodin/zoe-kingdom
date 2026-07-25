import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./index";

const collectionId = "users";

export type UserProfile = {
  uid: string;

  username: string;
  email: string;

  level: number;
  xp: number;

  spiritStage: string;

  avatar: number;

  statusNote: string;

  lastUploaded: any;

  createdAt: any;
  updatedAt: any;
};

/* -------------------------------------------------------------------------- */
/*                               USERNAME HELPER                              */
/* -------------------------------------------------------------------------- */

const generateUsername = (email: string) => {
  const prefix = email.split("@")[0].toLowerCase();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}_${random}`;
};

/* -------------------------------------------------------------------------- */
/*                                SYNC PROFILE                                */
/* -------------------------------------------------------------------------- */

export const syncUserProfile = async (
  uid: string,
  data: {
    email: string;
    userData: Partial<UserProfile>;
  },
) => {
  const ref = doc(db, collectionId, uid);

  const snapshot = await getDoc(ref);

  // USER EXISTS
  if (snapshot.exists()) {
    await updateDoc(ref, {
      updatedAt: serverTimestamp(),
    });

    return snapshot.data();
  }

  // CREATE NEW USER
  const profile: UserProfile = {
    uid,

    username: data.userData.username || generateUsername(data.email),

    email: data.email,

    level: 1,
    xp: 0,

    spiritStage: "Kindled Flame",

    avatar: 0,

    statusNote: "",

    lastUploaded: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data.userData,
  };

  await setDoc(ref, profile);

  return profile;
};

/* -------------------------------------------------------------------------- */
/*                               GET USER PROFILE                             */
/* -------------------------------------------------------------------------- */

export const getUserProfile = async (uid: string) => {
  const snapshot = await getDoc(doc(db, collectionId, uid));

  if (!snapshot.exists()) return null;

  return snapshot.data() as UserProfile;
};

/* -------------------------------------------------------------------------- */
/*                               UPDATE PROFILE                               */
/* -------------------------------------------------------------------------- */

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
) => {
  await updateDoc(doc(db, collectionId, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                              UPDATE STATUS NOTE                            */
/* -------------------------------------------------------------------------- */

export const updateStatusNote = async (uid: string, statusNote: string) => {
  await updateDoc(doc(db, collectionId, uid), {
    statusNote,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                               UPDATE AVATAR                                */
/* -------------------------------------------------------------------------- */

export const updateAvatar = async (uid: string, avatar: number) => {
  await updateDoc(doc(db, collectionId, uid), {
    avatar,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                                  UPDATE XP                                 */
/* -------------------------------------------------------------------------- */

export const updateXP = async (uid: string, xp: number) => {
  await updateDoc(doc(db, collectionId, uid), {
    xp,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                                UPDATE LEVEL                                */
/* -------------------------------------------------------------------------- */

export const updateLevel = async (uid: string, level: number) => {
  await updateDoc(doc(db, collectionId, uid), {
    level,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                            UPDATE SPIRIT STAGE                             */
/* -------------------------------------------------------------------------- */

export const updateSpiritStage = async (uid: string, spiritStage: string) => {
  await updateDoc(doc(db, collectionId, uid), {
    spiritStage,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                           ADD XP + AUTO LEVELING                           */
/* -------------------------------------------------------------------------- */

export const addXPToUser = async (uid: string, amount: number) => {
  const profile = await getUserProfile(uid);

  if (!profile) return;

  let newXP = profile.xp + amount;

  let level = profile.level;

  // SIMPLE LEVEL SYSTEM
  const xpNeeded = level * 100;

  if (newXP >= xpNeeded) {
    level += 1;
    newXP -= xpNeeded;
  }

  await updateDoc(doc(db, collectionId, uid), {
    xp: newXP,
    level,
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                              GET USER STATUS FEED                          */
/* -------------------------------------------------------------------------- */

export const getUserStatusFeed = async () => {
  const q = query(
    collection(db, collectionId),
    orderBy("updatedAt", "desc"),
    limit(50),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    uid: doc.data().uid,

    username: doc.data().username,

    avatar: doc.data().avatar,

    statusNote: doc.data().statusNote,

    spiritStage: doc.data().spiritStage,
  }));
};

/* -------------------------------------------------------------------------- */
/*                               GET ALL USERS                                */
/* -------------------------------------------------------------------------- */

export const getAllUsersSortedByLastUpload = async () => {
  const snapshot = await getDocs(collection(db, collectionId));

  const users = snapshot.docs.map((doc) => ({
    ...(doc.data() as UserProfile),
  }));

  users.sort((a, b) => {
    // Handle users with no uploads
    if (!a.lastUploaded && !b.lastUploaded) return 0;
    if (!a.lastUploaded) return 1;
    if (!b.lastUploaded) return -1;

    // Firestore Timestamp -> milliseconds
    const aTime =
      typeof a.lastUploaded.toMillis === "function"
        ? a.lastUploaded.toMillis()
        : new Date(a.lastUploaded).getTime();

    const bTime =
      typeof b.lastUploaded.toMillis === "function"
        ? b.lastUploaded.toMillis()
        : new Date(b.lastUploaded).getTime();

    // Newest first
    return bTime - aTime;
  });

  return users;
};

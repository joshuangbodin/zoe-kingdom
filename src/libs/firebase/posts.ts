import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";

import { db } from "./index";

// CREATE POST
export const createPost = async (
  userId: string,
  text: string
) => {
  return await addDoc(collection(db, "posts"), {
    userId,
    text,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
};

// REALTIME FEED
export const subscribeToFeed = (
  callback: (posts: any[]) => void
) => {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(posts);
  });
};

// LIKE POST
export const likePost = async (postId: string) => {
  const ref = doc(db, "posts", postId);

  await updateDoc(ref, {
    likesCount: increment(1),
  });
};
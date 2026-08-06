import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./index";
import { enqueueOp } from "@/libs/offline/queue";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type CreatePostPayload = {
  uid: string;

  thought: string;

  verseText?: string;

  verseReference?: string;

  tags?: string[];
};

/* -------------------------------------------------------------------------- */
/*                                CREATE POST                                 */
/* -------------------------------------------------------------------------- */

export const createPost = async (
  payload: CreatePostPayload,
) => {
  return await addDoc(collection(db, "posts"), {
    uid: payload.uid,

    thought: payload.thought,

    verseText: payload.verseText || "",

    verseReference:
      payload.verseReference || "",

    tags: payload.tags || [],

    likesCount: 0,
    commentsCount: 0,

    reportsCount: 0,

    archived: false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                               SUBSCRIBE FEED                               */
/* -------------------------------------------------------------------------- */

export const subscribeToFeed = (
  callback: (posts: any[]) => void,
) => {
  const q = query(
    collection(db, "posts"),
    where("archived", "==", false),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(posts);
  });
};

// export const subscribeToUsers = (
//   callback: (posts: any[]) => void,
// ) => {
//   const q = query(
//     collection(db, "users"),
//     where("archived", "==", false),
//     orderBy("createdAt", "desc"),
//     limit(50),
//   );

//   return onSnapshot(q, (snapshot) => {
//     const posts = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     callback(posts);
//   });
// };

/* -------------------------------------------------------------------------- */
/*                               CREATE COMMENT                               */
/* -------------------------------------------------------------------------- */

export const createComment = async (
  postId: string,
  payload: {
    uid: string;
    username: string;
    avatar: number;
    text: string;
  },
) => {
  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      ...payload,

      createdAt: serverTimestamp(),
    },
  );

  // increment post count
  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1),
  });
};

/* -------------------------------------------------------------------------- */
/*                             SUBSCRIBE COMMENTS                             */
/* -------------------------------------------------------------------------- */

export const subscribeToComments = (
  postId: string,
  callback: (comments: any[]) => void,
) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(comments);
  });
};

/* -------------------------------------------------------------------------- */
/*                                  LIKE POST                                 */
/* -------------------------------------------------------------------------- */

export const likePost = async (
  postId: string,
  uid: string,
) => {
  const likeRef = doc(
    db,
    "posts",
    postId,
    "likes",
    uid,
  );

  const existing = await getDoc(likeRef);

  // already liked
  if (existing.exists()) {
    return;
  }

  // create like doc
  await updateDoc(doc(db, "posts", postId), {
    likesCount: increment(1),
  });

  await setDoc(likeRef, {
    uid,

    createdAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                                 UNLIKE POST                                */
/* -------------------------------------------------------------------------- */

export const unlikePost = async (
  postId: string,
  uid: string,
) => {
  const likeRef = doc(
    db,
    "posts",
    postId,
    "likes",
    uid,
  );

  const existing = await getDoc(likeRef);

  if (!existing.exists()) return;

  await deleteDoc(likeRef);

  await updateDoc(doc(db, "posts", postId), {
    likesCount: increment(-1),
  });
};

/* -------------------------------------------------------------------------- */
/*                              CHECK USER LIKED                              */
/* -------------------------------------------------------------------------- */

export const hasUserLikedPost = async (
  postId: string,
  uid: string,
) => {
  const snapshot = await getDoc(
    doc(db, "posts", postId, "likes", uid),
  );

  return snapshot.exists();
};

/* -------------------------------------------------------------------------- */
/*                                 REPORT POST                                */
/* -------------------------------------------------------------------------- */

export const reportPost = async (
  postId: string,
  payload: {
    uid: string;
    reason: string;
  },
) => {
  await addDoc(collection(db, "reports"), {
    postId,

    uid: payload.uid,

    reason: payload.reason,

    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "posts", postId), {
    reportsCount: increment(1),
  });
};

/* -------------------------------------------------------------------------- */
/*                                DELETE POST                                 */
/* -------------------------------------------------------------------------- */

export const deletePost = async (
  postId: string,
  creatorUid: string,
) => {
  const ref = doc(db, "posts", postId);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  // ONLY CREATOR CAN DELETE
  if (data.uid !== creatorUid) {
    throw new Error("Unauthorized");
  }

  // soft delete
  await updateDoc(ref, {
    archived: true,

    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                                 UPDATE POST                                */
/* -------------------------------------------------------------------------- */

export const updatePost = async (
  postId: string,
  creatorUid: string,
  thought: string,
) => {
  const ref = doc(db, "posts", postId);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  // ONLY CREATOR
  if (data.uid !== creatorUid) {
    throw new Error("Unauthorized");
  }

  await updateDoc(ref, {
    thought,

    updatedAt: serverTimestamp(),
  });
};

/* -------------------------------------------------------------------------- */
/*                      OFFLINE-AWARE SMART WRAPPERS                           */
/* -------------------------------------------------------------------------- */

type Online = boolean;

export const createPostSmart = async (
  payload: CreatePostPayload,
  isOnline: Online,
) => {
  if (isOnline) {
    const ref = await createPost(payload);
    return { offline: false, id: ref.id };
  }
  await enqueueOp({ type: "create_post", payload });
  return { offline: true, id: null };
};

export const likePostSmart = async (
  postId: string,
  uid: string,
  isOnline: Online,
) => {
  if (isOnline) {
    await likePost(postId, uid);
    return { offline: false };
  }
  await enqueueOp({ type: "like_post", payload: { postId, uid } });
  return { offline: true };
};

export const unlikePostSmart = async (
  postId: string,
  uid: string,
  isOnline: Online,
) => {
  if (isOnline) {
    await unlikePost(postId, uid);
    return { offline: false };
  }
  await enqueueOp({ type: "unlike_post", payload: { postId, uid } });
  return { offline: true };
};

export const createCommentSmart = async (
  postId: string,
  comment: { uid: string; username: string; avatar: number; text: string },
  isOnline: Online,
) => {
  if (isOnline) {
    await createComment(postId, comment);
    return { offline: false };
  }
  await enqueueOp({ type: "create_comment", payload: { postId, comment } });
  return { offline: true };
};

export const updatePostSmart = async (
  postId: string,
  creatorUid: string,
  thought: string,
  isOnline: Online,
) => {
  if (isOnline) {
    await updatePost(postId, creatorUid, thought);
    return { offline: false };
  }
  await enqueueOp({
    type: "update_post",
    payload: { postId, creatorUid, thought },
  });
  return { offline: true };
};

export const deletePostSmart = async (
  postId: string,
  creatorUid: string,
  isOnline: Online,
) => {
  if (isOnline) {
    await deletePost(postId, creatorUid);
    return { offline: false };
  }
  await enqueueOp({ type: "delete_post", payload: { postId, creatorUid } });
  return { offline: true };
};

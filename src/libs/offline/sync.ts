import { OfflineOp, getQueue, replaceQueue } from "./queue";
import {
  createPost,
  likePost,
  unlikePost,
  createComment,
  updatePost,
  deletePost,
  savePostForUser,
  removeSavedPost,
  reportPost,
  CreatePostPayload,
} from "@/libs/firebase/posts";
import {
  updateUserProfile,
  followUser,
  unfollowUser,
} from "@/libs/firebase/users";

/**
 * Replays the offline write queue against Firestore in order. Ops that fail
 * transiently are left in the queue for the next retry; successful ops are
 * removed. Returns the number of remaining pending ops.
 */
export const syncOfflineQueue = async (): Promise<number> => {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const remaining: OfflineOp[] = [];

  for (const op of queue) {
    try {
      await runOp(op);
    } catch (err) {
      console.warn("offline sync op failed (will retry):", op.type, err);
      remaining.push(op);
    }
  }

  await replaceQueue(remaining);
  return remaining.length;
};

async function runOp(op: OfflineOp): Promise<void> {
  const p = op.payload;

  switch (op.type) {
    case "create_post":
      await createPost(p as unknown as CreatePostPayload);
      break;

    case "like_post":
      await likePost(p.postId as string, p.uid as string);
      break;

    case "unlike_post":
      await unlikePost(p.postId as string, p.uid as string);
      break;

    case "create_comment":
      await createComment(p.postId as string, p.comment);
      break;

    case "update_post":
      await updatePost(p.postId as string, p.creatorUid as string, p.thought as string);
      break;

    case "delete_post":
      await deletePost(p.postId as string, p.creatorUid as string);
      break;

    case "update_profile":
      await updateUserProfile(p.uid as string, p.data);
      break;

    case "follow_user":
      await followUser(p.followerUid as string, p.followeeUid as string);
      break;

    case "unfollow_user":
      await unfollowUser(p.followerUid as string, p.followeeUid as string);
      break;

    case "save_post":
      await savePostForUser(p.userUid as string, p.postId as string);
      break;

    case "unsave_post":
      await removeSavedPost(p.userUid as string, p.postId as string);
      break;

    case "report_post":
      await reportPost(p.postId as string, {
        uid: p.uid as string,
        reason: p.reason as string,
      });
      break;

    default:
      // Unknown op type — drop it so the queue cannot get stuck.
      break;
  }
}

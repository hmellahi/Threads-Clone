"use client";

import {
  likeThread,
  unLikeThread,
} from "@/server-actions/thread/thread.actions";
import Image from "next/image";
import Link from "next/link";
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { Heart, Reply, HeartFilled, Repost, Share } from "../svgs";
import { ThreadWithDetails } from "@/types/Thread";
import { timeAgo } from "@/lib/timeConverter";
import { UsersList } from "../community/UsersList";
import ThreadActions from "../shared/Thread/ThreadActions";
import { MediaViewer } from "../ui/MediaViewer";
import { User } from "@prisma/client";
import { showLikesCount } from "@/lib/utils";
import { debounce } from "@/lib/debounce";
import { useRouter } from "next/navigation";

function ThreadCard({
  thread,
  userId,
  isComment = false,
  path,
  className = "",
  onDelete,
  measure = () => {},
  style,
}: {
  thread: ThreadWithDetails;
  userId: string;
  isComment?: boolean;
  path: string;
  className: string;
  onDelete?: Function;
}) {
  if (thread.isDeleted) {
    return null;
  }

  const router = useRouter();
  const { text, author } = thread;
  const isLikedByCurrentUser = thread?.likes?.length > 0;
  const threadRepliers: User[] = [];
  const uniqueAuthors: { [id: string]: string } = {};

  thread.childrens?.forEach((subThread: ThreadWithDetails) => {
    if (subThread?.author?.id) {
      const authorId = subThread.author.id;
      if (!uniqueAuthors[authorId]) {
        uniqueAuthors[authorId] = authorId;
        threadRepliers.push(subThread.author);
      }
    }
  });

  const [isUserLikedThread, setisUserLikedThread] =
    useState(isLikedByCurrentUser);

  // Debounce the saveUserReaction function
  const debouncedSaveUserReaction = debounce(
    async (isUserLikedThread: boolean) => {
      if (isUserLikedThread) {
        await unLikeThread({ likeId: userLikeId, path });
      } else {
        await likeThread({
          userId: userId,
          threadId: thread.id,
          path,
        });
      }
    },
    200
  ); // 1000ms debounce interval

  // Use useCallback to memoize the debounced function
  const memoizedDebouncedSaveUserReaction = useCallback(
    debouncedSaveUserReaction,
    []
  );

  // Update reactToThread to call the memoized debounced function
  async function reactToThread(e) {
    e.preventDefault();
    e.stopPropagation();

    setisUserLikedThread(!isUserLikedThread);

    memoizedDebouncedSaveUserReaction(isUserLikedThread);
  }

  const hasReplies = thread?.childrens?.length > 0;
  let threadLikes = thread?._count?.likes || 0;
  let likesCount = +isUserLikedThread + threadLikes - 1;
  if (isUserLikedThread && likesCount == 0) {
    likesCount = 1;
  }
  const hasLikes = likesCount > 0;

  const LikeIcon = isUserLikedThread ? HeartFilled : Heart;
  const bg = isComment ? "bg-transparent" : "bg-dark-2d";
  const threadImages = thread?.images?.map((image) => image.imageUrl);

  return (
    <div
      className={`${bg} ${className} text-white py-7 px-0 sm:px-2 cursor-pointer`}
      onClick={() => router.push(`/thread/${thread.id}`)}
      style={style}
    >
      <div className="flex justify-between items-start">
        <div className={`flex gap-3 relative w-full`}>
          <div className="flex flex-col items-center">
            <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
              <Image
                onLoad={measure}
                src={author.image || ""}
                alt="avatar"
                fill
                className="cursor-pointer rounded-full object-cover"
                loading="lazy"
              ></Image>
            </Link>
            {hasReplies && <div className="thread-card_bar" />}
          </div>
          <div className="w-full">
            <div className="w-full">
              <div className="flex justify-between w-full items-start ">
                <div className="w-full">
                  <Link
                    href={`/profile/${author.id}`}
                    className="relative h-11 w-11"
                  >
                    {author?.username}
                  </Link>
                </div>

                <div
                  className={`text-gray-2 text-small-regular mr-0 sm:mr-4 flex gap-2 items-center -mt-[.3rem] `}
                >
                  {timeAgo(thread.createdAt)}
                  {author.id === userId && (
                    <ThreadActions
                      threadId={thread.id}
                      authorId={author.id}
                      path={path}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              </div>
              <p className="whitespace-pre-line	text-small-regular font-light mt-1">
                {text}
              </p>
            </div>
            {threadImages?.length > 0 && (
              <MediaViewer
                className="mt-4"
                imageURLs={threadImages}
                onLoad={measure}
              ></MediaViewer>
            )}
            <div className={`flex gap-2 mt-2 text-white items-center`}>
              <div className="icon-hover relative">
                <LikeIcon
                  width="25"
                  height="25"
                  className="cursor-pointer"
                  onClick={reactToThread}
                />
              </div>
              <div className="icon-hover">
                <Link
                  href={`/thread/${thread.id}`}
                  className={className}
                  aria-label="Comment"
                >
                  <Reply width="25" height="25" />
                </Link>
              </div>
              <div className="icon-hover">
                <Repost width="25" height="25" />
              </div>
              <div className="icon-hover">
                <Share width="25" height="25" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {(hasReplies || hasLikes) && (
        <div className="flex items-center">
          <UsersList
            className="z-20 w-[3.7rem] justify-center"
            users={threadRepliers}
            width={15}
            height={15}
          ></UsersList>
          <div className="text-[#A0A0A0] flex items-center gap-x-2 ">
            {hasReplies && (
              <>
                <p>{thread?.childrens?.length} replies</p>
                {hasLikes && (
                  <div className="rounded-full w-1 h-1 bg-gray-1"></div>
                )}
              </>
            )}
            {showLikesCount(likesCount)}
          </div>
        </div>
      )}
    </div>
  );
}

// export default forwardRef(ThreadCard);
export default ThreadCard;
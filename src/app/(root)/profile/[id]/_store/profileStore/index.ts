import * as threadActions from "@/server-actions/thread/thread.actions";
import { CreateThreadParams, FetchThreadsParams } from "@/types/Thread";
import { Thread } from "@prisma/client";
import { useRouter } from "next/navigation";
import { create, useStore } from "zustand";
import useUserStore from "../../../../../../store/userStore";
import { profileStore } from "../../_types/profileStore";

const deleteThread = ({
  path,
  authorId,
  threadId,
}: {
  path: string;
  authorId: string;
  threadId: string;
}) => {
  let { totalCount, threads } = useProfileStore.getState();
  const thread = threads.find((thread) => thread.id === threadId);
  const threadIndex = threads.indexOf(thread);
  if (!thread) return;

  // threads.splice(threadIndex, 1);
  // thread.isDeleted = true
  threads = [
    ...threads.slice(0, threadIndex),
    ...threads.slice(threadIndex + 1, threads.length),
  ];

  useProfileStore.setState({ totalCount: --totalCount, threads });

  threadActions.removeThread({ path, authorId, threadId });
  if (path.includes("thread")) useRouter().push("/");
};

const fetchUserThreads = async (
  params: FetchThreadsParams,
  clearOldList: boolean = false
) => {
  const { threads, setIsThreadsLoading, setThreads } =
    useProfileStore.getState();

  if (clearOldList) {
    setThreads([]);
  }

  setIsThreadsLoading(true);

  console.log({ params });
  let { threads: newThreads, totalCount } =
    await threadActions.fetchUserThreads(params);

  setIsThreadsLoading(false);

  console.log({ newThreads });

  if (!clearOldList && threads) {
    newThreads = [...threads, ...newThreads];
  }

  useProfileStore.setState({ totalCount, threads: newThreads });

  return { threads, totalCount };
};

const createThread = async (params: CreateThreadParams) => {
  const { setThreads, threads, totalCount } = useProfileStore.getState();
  const { currentUser } = useUserStore.getState();

  const createdThread = await threadActions.createThread(params);
  createdThread.author = currentUser;

  setThreads([createdThread, ...threads]);
  useProfileStore.setState({ totalCount: totalCount + 1 });
};

const useProfileStore = create<profileStore>((set) => ({
  threads: null,
  totalCount: 0,
  isThreadsLoading: true,
  deleteThread,
  fetchUserThreads,
  createThread,
  setThreads: (newThreads: Thread[]) => set(() => ({ threads: newThreads })),
  setIsThreadsLoading: (value: boolean) =>
    set(() => ({ isThreadsLoading: value })),
}));

export default useProfileStore;
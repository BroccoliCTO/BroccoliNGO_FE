"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addProof,
  fetchFundRecords,
  fetchProfile,
  fetchTaskDetail,
  fetchVoteResult,
  fetchXGenerateLink,
  uploadJson,
} from "@/shared/api";
import { usePublicClient } from "wagmi";
import { ABI, CONTRACT_ADDRESS } from "@/shared/constant";
import { Task } from "@/shared/types/task";
import { HelpRequest, NFTMetaData } from "@/shared/types/rescue";
import { HelpRequest2, NFTMetaData2 } from "@/shared/types/help";
import {
  checkIsVoteOnchainMetadata,
  nftMetaDataToHelpRequest,
  nftMetaDataToHelpRequest2,
  VoteOnchainMetadata,
} from "@/shared/task";
import { VoteResult } from "@/shared/types/vote";
import { Profile } from "@/shared/types/profile";

interface TaskDetailsContextType {
  profile: Profile | null;
  xAuthLink: string;
  isAuthor: boolean;
  tokenId: string;
  task: Task | null;
  isApproved: boolean;
  loading: boolean;
  taskMetaData: HelpRequest | HelpRequest2 | null;
  voteResult: VoteResult;
  isVoteEnded: boolean;
  taskStatus: "Pending" | "Approved" | "Rejected" | "";
  voteFinalResult: "Approved" | "Rejected" | "";
  parsedFundRecords: string[];
  onchainVoteMetadata: VoteOnchainMetadata | null;
  onchainVoteResultURL: string;
  uploadedFundRecords: string[];
  refreshFundRecords: () => void;
  error?: string;
  refreshTask: () => void;
}

const TaskDetailsContext = createContext<TaskDetailsContextType | undefined>(
  undefined
);

export const TaskDetailsProvider = ({
  tokenId,
  children,
}: {
  tokenId: string;
  children: ReactNode;
}) => {
  const publicClient = usePublicClient();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskMetaData, setTaskMetaData] = useState<
    HelpRequest | HelpRequest2 | null
  >(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState("");
  const [voteResult, setVoteResult] = useState<VoteResult>({
    0: 0,
    1: 0,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [xAuthLink, setXAuthLink] = useState("");

  const [fetchingFundRecords, setFetchingFundRecords] = useState(false);
  const [parsingFundRecords, setParsingFundRecords] = useState(false);
  const [uploadedFundRecords, setUploadedFundRecords] = useState<string[]>([]);
  const [parsedFundRecords, setParsedFundRecords] = useState<string[]>([]);
  const [onchainVoteResultURL, setOnchainVoteResultURL] = useState("");
  const [onchainVoteMetadata, setOnchainVoteMetadata] =
    useState<VoteOnchainMetadata | null>(null);

  const isAuthor = useMemo(() => {
    if (!profile || !taskMetaData) return false;
    return profile.handle === taskMetaData.organization.contact.twitter;
  }, [profile, taskMetaData]);

  const isVoteEnded = useMemo(() => {
    if (!task) return false;
    return task.voteLeftTime <= 0;
  }, [task]);

  const voteFinalResult = useMemo(() => {
    if (!voteResult || !isVoteEnded) return "";
    if (voteResult[0] > voteResult[1]) return "Rejected";
    if (voteResult[1] > voteResult[0]) return "Approved";
    return "";
  }, [isVoteEnded, voteResult]);

  const taskStatus = useMemo(() => {
    if (!task) return "";
    if (task.status === 2 && voteFinalResult === "Approved") return "Approved";
    if (task.status === 2 && voteFinalResult === "Rejected") return "Rejected";
    if (task.status === 2) return "Approved";
    if ((task.status === 1 || isApproved) && voteFinalResult === "Approved")
      return "Approved";
    if ((task.status === 1 || isApproved) && voteFinalResult === "Rejected")
      return "Rejected";
    if (task.status === 0 || !voteFinalResult) return "Pending";
    return "";
  }, [task, voteFinalResult, isApproved]);

  async function getTaskData(id: string) {
    const res = await fetchTaskDetail(id);
    if (res.code === 0) {
      setTask(res.data);
      return res.data;
    }
    return null;
  }

  async function getVoteResult(tokenId: string) {
    const res = await fetchVoteResult(tokenId);
    if (res.code === 0) {
      setVoteResult({
        0: res.data[0] || 0,
        1: res.data[1] || 0,
      });
    }
    return res.data;
  }

  const checkIsApproved = async (tokenId: string) => {
    const res = await publicClient?.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "approval",
      args: [BigInt(tokenId)],
    });
    return !!res;
  };

  async function loadTaskMetaData(tokenUri: string) {
    if (!tokenUri) return null;
    const data: NFTMetaData | NFTMetaData2 = await fetch(tokenUri).then((res) =>
      res.json()
    );
    if (
      data.attributes.find((attr) => attr.trait_type === "version")?.value ===
      "0.2"
    ) {
      setMetadataLoading(false);
      return nftMetaDataToHelpRequest2(data as NFTMetaData2);
    }
    setMetadataLoading(false);
    return nftMetaDataToHelpRequest(data as NFTMetaData);
  }

  const getUploadedFundRecords = async (tokenId: string) => {
    setFetchingFundRecords(true);
    const res = await fetchFundRecords(tokenId);
    if (res.code === 0) {
      setUploadedFundRecords(res.data.map(({ URI }: any) => URI));
    }
    setFetchingFundRecords(false);
    // const res = await publicClient?.readContract({
    //   address: CONTRACT_ADDRESS,
    //   abi: ABI,
    //   functionName: "fundRecord",
    //   args: [BigInt(tokenId), BigInt(0)],
    // });
    // setUploadedFundRecords((prev) => [...prev, res || ""]);
    // setUploadedFundRecordsLoading(false);
    console.log("func records", res);
  };

  useEffect(() => {
    if (!tokenId) return;
    getTaskData(tokenId)
      .then((data) => {
        loadTaskMetaData(data?.URI).then(async (metadata) => {
          setTaskMetaData(metadata);
        });
        getVoteResult(tokenId)
        checkIsApproved(tokenId).then((bool) => {
          setIsApproved(bool);
        });
        getUploadedFundRecords(tokenId);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tokenId]);

  useEffect(() => {
    fetchProfile().then((res) => {
      if (res.code === 0) {
        setProfile(res.data);
        return;
      }
      fetchXGenerateLink(`/task/${tokenId}`).then((res) => {
        if (res.code === 0) {
          setXAuthLink(res.data.url);
        }
      });
    });
    return () => {
      setProfile(null);
      setXAuthLink("");
    };
  }, [tokenId]);

  useEffect(() => {
    if (!uploadedFundRecords.length) return;
    async function loadFundRecords() {
      setParsingFundRecords(true);
      await Promise.all(
        uploadedFundRecords.map(async (record) => {
          return await fetch(record)
            .then((res) => res.json())
            .then((data: any) => {
              if (checkIsVoteOnchainMetadata(data)) {
                setOnchainVoteResultURL(record);
                setOnchainVoteMetadata(data);
              } else {
                setParsedFundRecords((prev) => [...prev, ...data]);
              }
            });
        })
      );
      setParsingFundRecords(false);
    }
    loadFundRecords();
    return () => {
      setParsedFundRecords([]);
      setOnchainVoteResultURL("");
      setOnchainVoteMetadata(null);
    };
  }, [uploadedFundRecords]);

  return (
    <TaskDetailsContext.Provider
      value={{
        profile,
        xAuthLink,
        isAuthor,
        tokenId,
        task,
        isApproved,
        loading: loading || metadataLoading || fetchingFundRecords || parsingFundRecords,
        taskMetaData,
        voteResult,
        isVoteEnded,
        taskStatus,
        voteFinalResult,
        parsedFundRecords,
        onchainVoteResultURL,
        onchainVoteMetadata,
        uploadedFundRecords,
        error,
        refreshFundRecords: () => {
          getUploadedFundRecords(tokenId);
        },
        refreshTask: () => {
          getTaskData(tokenId);
        },
      }}
    >
      {children}
    </TaskDetailsContext.Provider>
  );
};

export const useTaskDetailsCtx = () => {
  const context = useContext(TaskDetailsContext);
  if (context === undefined) {
    throw new Error(
      "useTaskDetailsCtx must be used within a TaskDetailsProvider"
    );
  }
  return context;
};

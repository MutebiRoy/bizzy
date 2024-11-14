"use client";
import { useState, useEffect } from "react";
import { ListFilter, Search, ChevronLeft, ArrowLeft } from "lucide-react";
import { Input } from "../ui/input";
import ThemeSwitch from "./theme-switch";
import Conversation from "./conversation";
import { UserButton, useUser } from "@clerk/nextjs";
import UserListDialog from "./user-list-dialog";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import RightPanel from "./right-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GroupMembersDialog from "./group-members-dialog";
import { Id } from "../../../convex/_generated/dataModel";
import SearchUsers from "./search_users";
import { convertConversationTypes, ConversationType, UserType} from "@/utils/conversation_utils";

interface LastMessage {
  _id: string;
  _creationTime: string | number;
  conversation: string;
  sender: string;
  content: string;
  messageType: "image" | "text" | "video";
}

interface Conversation {
  _id: string | null;
  _creationTime: string | number;
  lastMessage?: LastMessage;
  isGroup: boolean;
  //participants: string[];
  [key: string]: any; // Additional properties as needed
}

const LeftPanel = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Use `getMe` query to get Convex user
  const me = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );

  // const conversations = useQuery(
  //   api.conversations.getMyConversations,
  //   isAuthenticated ? {} : "skip"
  // );
  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? {} : "skip"
  );

  const setConversationLastRead = useMutation(api.conversations.setConversationLastRead);

  const { selectedConversation, setSelectedConversation, isViewingConversation, setIsViewingConversation } = useConversationStore();

  const conversationName =
    selectedConversation?.groupName ||
    selectedConversation?.name ||
    "No conversation selected";
    
  const conversationImage =
    selectedConversation?.groupImage ||
    selectedConversation?.image ||
    "/default-avatar.png";

  const currentUserId = me?._id;

  useEffect(() => {
    const conversationIds = conversations?.map((conversation) => conversation._id);
    if (
      selectedConversation &&
      conversationIds &&
      !conversationIds.includes(selectedConversation._id)
    ) {
      setSelectedConversation(null);
    }
  }, [conversations, selectedConversation, setSelectedConversation]);

  if (isLoading) return null;
  if (!isAuthenticated || !me) return null;

  const handleBackClick = () => {
    setIsViewingConversation(false);
    setSelectedConversation(null);
  };

  const handleConversationClick = async (conversation: ConversationType) => {
    setSelectedConversation(conversation);
    setIsViewingConversation(true);

    // Mark conversation as read
    if (conversation._id) {
      await setConversationLastRead({ conversationId: conversation._id });
    } else {
      console.error("Conversation ID is null");
    }
  };
  
  return (
    <div className="w-full overflow-hidden h-screen">
      <div className="fixed top-0 left-0 right-0 bg-left-panel z-10 ">
        <div className="flex justify-between bg-gray-primary p-3">
          {isViewingConversation ? (
            <div className="flex items-center">
              <button onClick={handleBackClick}>
                <ArrowLeft size={24} />
              </button>
              <Avatar className="ml-4">
                <AvatarImage
                  src={conversationImage || "/placeholder.png"}
                  className="object-cover"
                />
                <AvatarFallback>
                  <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col ml-4">
                <p>{conversationName}</p>
                {selectedConversation && selectedConversation.isGroup && (
                  <GroupMembersDialog selectedConversation={selectedConversation} />
                )}
              </div>
            </div>
          ) : (
            <UserButton />
          )}
          <div className="flex items-center gap-3">
            {isAuthenticated && <UserListDialog />}
            <ThemeSwitch />
          </div>
        </div>
        {!isViewingConversation && (
          <div className="p-3 flex items-center">
           {/* Use the SearchUsers component here */}
           <SearchUsers />
          </div>
        )}
      </div>
      <div
        className={`my-3 flex flex-col gap-0 overflow-auto h-full pb-[44px] ${
          !isViewingConversation ? "pt-[136px]" : "pt-[78px]"
        }`}
      >
        
        {!isViewingConversation &&
        currentUserId &&
          conversations?.map((conversation, index) => (
            <div className={index === 0 ? "pt-[0px]" : ""} key={conversation._id}>
              <Conversation
                key={conversation._id}
                conversation={convertConversationTypes(conversation, currentUserId)}
                onClick={() => handleConversationClick(convertConversationTypes(conversation, currentUserId))}
              />
            </div>
          ))
        }

        {isViewingConversation && selectedConversation && (
          <div className="overflow-auto h-full">
            <RightPanel conversation={selectedConversation} />
          </div>
        )}
        {conversations?.length === 0 && !isViewingConversation && (
          <>
            <p className="text-center text-gray-500 text-sm mt-3">No conversations yet!</p>
            <p className="text-center text-gray-500 text-sm mt-3">
              Select any name to start a conversation
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;

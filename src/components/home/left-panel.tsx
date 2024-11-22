"use client";
import { useState, useEffect } from "react";
import { ListFilter, Search, ChevronLeft, ArrowLeft, Users, Settings } from "lucide-react";
import { Input } from "../ui/input";
import Link from 'next/link'
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
  ) ?? [];

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

  // const handleConversationClick = (conversation: ConversationType) => {
  //   setSelectedConversation(conversation);
  //   setIsViewingConversation(true);
  // };

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
    // <div className="w-full overflow-hidden h-screen">
    <div className="flex flex-col h-full chat-container">
      {isViewingConversation && selectedConversation ? (
        <>
          {/* Header - Chat View*/}
          <header className="flex-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 text-white">
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                  aria-label="Go Back"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                {/* Link to Profile Page */}
                <Link href={`/profile/`} className="flex items-center space-x-4">
                  <Avatar className="ml-2 w-6 h-6">
                    <AvatarImage
                      src={conversationImage || "/placeholder.png"}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-lg font-sm">{conversationName}</h1>
                </Link>
                {selectedConversation && selectedConversation.isGroup && (
                  <GroupMembersDialog selectedConversation={selectedConversation} />
                )}
              </div>
              <div className="flex items-center space-x-6">
                {/* Create Groups Icon /> */}
                {isAuthenticated && <UserListDialog />}

                {/* <ThemeSwitch /> */}
                <ThemeSwitch />
              </div>
            </div>
          </header>

          {/* Right Pannel */}

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* // <div className="overflow-auto h-full"> */}
              <RightPanel conversation={selectedConversation} />
            {/* // </div> */}
          </div>

        </>
      ) : currentUserId ? (
        <>
          {/* Header - Conversations list*/}
          <header className="flex-none flex-shrink-0">
            {/* Left: Logged in Profile Picture */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <UserButton />
                </div>
              </div>
      
              {/* Right: Create Groups, Online Users, Theme Toggle */}
              <div className="flex items-center space-x-6">
                {/* View Online Users */}
                <button
                  className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                  aria-label="View Online Users"  
                >
                  {/* User Online Button */}
                  <Users className="w-5 h-5" /> 
                </button>

                {/* Create Groups Icon /> */}
                {isAuthenticated && <UserListDialog />}

                {/* <ThemeSwitch /> */}
                <ThemeSwitch />
              </div>
            </div>
          </header>

          <div className="flex-none p-4">
            {/* Search Component */}
            <SearchUsers />
          </div>

          {/* Conversations List */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversations?.length > 0 ? (
              conversations?.map((conversation, index) => (
                
                  <div className={index === 0 ? "pt-[0px]" : ""} key={conversation._id}>
                    <Conversation
                      key={conversation._id}
                      conversation={convertConversationTypes(conversation, currentUserId)}
                      onClick={() => 
                        handleConversationClick(
                          convertConversationTypes(conversation, currentUserId)
                        )
                      }
                    />
                  </div>
              ))
            ) : (
              <>
                <p className="text-center text-gray-500 text-sm mt-3">
                  No conversations yet!
                </p>
                <p className="text-center text-gray-500 text-sm mt-3">
                  Select or search a name to start a conversation
                </p>
              </>
            )}
          </div>

          <footer className="flex-none flex-shrink-0">
            <div className="p-4 flex space-x-4">
              {/* Home Button */}
              {/* <button
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                aria-label="Home"
                onClick={onHome}
              >
                <House className="w-5 h-5 text-primary" />
              </button> */}
              {/* Edit Profile Button */}
            
              <button
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                aria-label="Edit Profile"
              >
                <Settings className="w-5 h-5 text-primary" />
              </button>
            </div>
          </footer> 

        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default LeftPanel;

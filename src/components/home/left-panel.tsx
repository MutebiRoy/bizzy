// src\components\home\left-panel.tsx
"use client";
import { useMemo, useState, useEffect,  useRef } from "react";
import { ArrowLeft, Home } from "lucide-react";
import Conversation from "./conversation";
import CustomUserButton from "./custom-user-button";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import RightPanel from "./right-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GroupMembersDialog from "./group-members-dialog";
import SearchUsers from "./search_users";
import ProfileDialog from "./profile-dialog";
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

  const rawConversations = useQuery(api.conversations.getMyConversations, isAuthenticated ? {} : "skip");
  const conversations = useMemo(() => rawConversations ?? [], [rawConversations]);

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

  // Ensure participants array does not contain null values
  const conversationParticipantList = selectedConversation?.participants.filter(
    (participant): participant is UserType => participant !== null
  ) || [];

  const otherParticipantInChat = conversationParticipantList.find(
    (participant) => participant._id.toString() !== me._id.toString()
  ) || null;
  
  return (
    
    <div className="app-container relative">
      {isViewingConversation && selectedConversation ? (
        <>
          <div className="empty70pixels"></div>
          {/* Header - Chat View*/}


          {/*  View Conversation*/}
          <main className="app-main" id="conversationListMain">
          {/* Safari padding and bottom padding */}
            <RightPanel conversation={selectedConversation} />
            {/* // </div> */}
          </main>
          <footer className="h-0">

          </footer>
          <div className="empty70pixels"></div>
        </>
      ) : currentUserId ? (
        <>
          <div className="empty70pixels"></div>
          {/* Header - Conversations list*/}
          

          {/* Conversations List */}
          
          <main className="app-main" id="conversationListMain">
            {/** Conversations List */}
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
          </main>

          
          <div className="empty70pixels"></div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default LeftPanel;

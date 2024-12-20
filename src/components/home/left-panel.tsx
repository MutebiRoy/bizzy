// src\components\home\left-panel.tsx
"use client";
import { useMemo, useState, useEffect,  useRef } from "react";
import { ListFilter, Search, ArrowLeft, Users, Settings, Home } from "lucide-react";
import { Input } from "../ui/input";
import Link from 'next/link';
import Conversation from "./conversation";
import CustomUserButton from "./custom-user-button";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import RightPanel from "./right-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GroupMembersDialog from "./group-members-dialog";
import { Id } from "../../../convex/_generated/dataModel";
import SearchUsers from "./search_users";
import EditProfileDialog from "./edit-profile-dialog";
import ProfileDialog from "./profile-dialog";
import { convertConversationTypes, ConversationType, UserType} from "@/utils/conversation_utils";
import { isSafari } from 'react-device-detect';

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
  
  // const mainRef = useRef<HTMLDivElement>(null);
  // const [isSafari, setIsSafari] = useState(false);

  // // Detect Safari browser
  // useEffect(() => {
  //const isSafariBrowser = isSafari;
  
  //alert(`Browser type: ${isSafari ? 'Safari' : 'Not Safari'}`);
  //   setIsSafari(isSafari);
  // }, []);
  
  
  // useEffect(() => {
  //       if (!isViewingConversation && mainRef.current) {
  //           mainRef.current.scrollTo(0, 0);
  //       }
  //   }, [isViewingConversation]);

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
    
    <div className="app-container">
      {isViewingConversation && selectedConversation ? (
        <div className="">
          {/* Header - Chat View*/}
          <header className="app-header fixed top-0 w-full z-50 bg-blue-500">
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

                {selectedConversation && (
                <ProfileDialog
                  user={!selectedConversation.isGroup ? otherParticipantInChat : null}
                  conversation={selectedConversation.isGroup ? selectedConversation : null}
                  trigger={
                    <div className="flex items-center space-x-4 cursor-pointer">
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
                    </div>
                  }
                />
                )}
                
                {/* View group members Dialog */}
                {selectedConversation && selectedConversation.isGroup && (
                  <GroupMembersDialog selectedConversation={selectedConversation} />
                )}
              </div>
              <div className="flex items-center space-x-6">
                {/* Create Groups Icon /> */}
                {/* {isAuthenticated && <UserListDialog />} */}

                {/* <ThemeSwitch /> */}
              </div>
            </div>
          </header>

          {/*  View Conversation*/}
          <main className="app-main">
          {/* Safari padding and bottom padding */}
            <RightPanel conversation={selectedConversation} />
            {/* // </div> */}
          </main>
          <footer className="h-0">

          </footer>

        </div>
      ) : currentUserId ? (
        <div className="">
          {/* Header - Conversations list*/}
          <header className="app-header fixed top-0 w-full z-50 bg-blue-500">
            {/* Left: Logged in Profile Picture */}
            <div className="flex items-center justify-between p-4">
              <CustomUserButton />
              <div className="flex-1 ml-4">
                {/* Search bar now placed next to profile image */}
                <SearchUsers />
              </div>
            </div>
          </header>

          {/* Conversations List */}
          
          <main className="app-main -webkit-overflow-scrolling:touch">
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

          <footer className="app-footer fixed bottom-0 w-full z-50 bg-blue-500">
            <div className="p-4 flex space-x-4">
              {/* Home Button */}
              <button
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                aria-label="Home"
                
              >
                <Home className="w-5 h-5 text-primary" />
              </button>
              {/* Edit Profile Button */}
            
              {/* <Home 
               
              /> */}

            </div>
          </footer> 

        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default LeftPanel;

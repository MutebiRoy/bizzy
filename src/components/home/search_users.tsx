import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { Search } from "lucide-react";
import { ConversationType, UserType } from "@/utils/conversation_utils";
import { useConvexAuth } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { User } from "@clerk/clerk-sdk-node";


const SearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { 
    setSelectedConversation, 
    setIsViewingConversation 
  } = useConversationStore();
  
  const { 
    isAuthenticated 
  } = useQuery(api.users.getMe) ? { 
    isAuthenticated: true 
  } : { 
    isAuthenticated: false 
  };

  const me = useQuery(api.users.getMe);
  const currentUserId = me?._id;

  // Trimmed search term to handle whitespace input
  const trimmedSearchTerm = searchTerm.trim();

  // Fetch search results
  const searchResults = useQuery(
    api.search.searchUsersByName,
    trimmedSearchTerm ? { searchTerm: trimmedSearchTerm } : "skip"
  );

  const getMyConversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? {} : "skip"
    );
    
  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? {} : "skip"
  );
  
  const createConversation = useMutation(api.conversations.createConversation);
  
  // Handle user selection from search results
  const handleSelectUser = async (selectedUser: any) => {
    if (!currentUserId) return;

    // Check if a conversation with the selected user already exists
    let existingConversation = conversations?.find((conversation) => {
      if (conversation.isGroup) return false;
      const participantIds = conversation.participants.map((p: UserType) => p._id);
  //     const participantIds = conversation.participants
  // .filter((p): p is UserType => p !== null)
  // .map((p) => p._id);
      return participantIds.includes(currentUserId) && participantIds.includes(selectedUser._id);
    });

    if (existingConversation) {
      // Open existing conversation
      setSelectedConversation(existingConversation);
      setIsViewingConversation(true);
    } else {
      // Do not create a new conversation yet
      // Instead, open the chat window with a temporary conversation state
      const tempConversation: ConversationType = {
        _id: null, // No backend ID yet
        participants: [selectedUser, me],
        isGroup: false,
        name: selectedUser.name || selectedUser.email.split("@")[0],
        image: selectedUser.image,
        isOnline: selectedUser.isOnline,
        _creationTime: Date.now().toString(), // Temporary timestamp
        isTemporary: true, // Flag to indicate this is a temporary conversation
      };

      // Set the temporary conversation as the selected conversation
      setSelectedConversation(tempConversation);
      setIsViewingConversation(true);
    }

    // Clear the search term to close the search results
    setSearchTerm("");
  // Handle user selection from search results
  // const handleSelectUser = async (selectedUser) => {
  //   // Check if a conversation with the selected user already exists
  //   let existingConversation = getMyConversations?.find((conversation) => {
  //     if (conversation.isGroup) return false;
  //     const participants = conversation.participants;
  //     return participants.includes(selectedUser._id);
  //   });

  //   if (existingConversation) {
  //     // Open existing conversation
  //     setSelectedConversation(existingConversation);
  //   } else {
  //     // Create a new conversation
  //     await createConversation({
  //       participants: [selectedUser._id],
  //       isGroup: false,
  //     });
  //   }

  //   // Clear the search term
  //   setSearchTerm("");
   };

  return (
    <div className="relative h-10 mx-3 flex-1">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" size={18}
      />
      <Input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent"
      />
      {trimmedSearchTerm && searchResults && (
        <div className="absolute mt-1 w-full bg-white border rounded shadow z-20">
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectUser(user)}
            >
              <Avatar className="mr-2">
                <AvatarImage src={user.image || "/placeholder.png"} alt={user.name} />
                <AvatarFallback>
                  <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchUsers;

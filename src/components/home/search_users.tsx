// src\components\home\search_users.tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { Search } from "lucide-react";
import { ConversationType, UserType, convertConversationTypes } from "@/utils/conversation_utils";
import { useConvexAuth } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { User } from "@clerk/clerk-sdk-node";
import { useRouter } from "next/navigation";

const SearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { 
    setSelectedConversation, 
    setIsViewingConversation 
  } = useConversationStore();

  // Use useConvexAuth to get isAuthenticated
  const { isAuthenticated } = useConvexAuth();

  // Conditionally call useQuery based on authentication status
  const me = useQuery(
    api.users.getMe, isAuthenticated ? {} : "skip"
  );
  const currentUserId = me?._id;

  // Trimmed search term to handle whitespace input
  const trimmedSearchTerm = searchTerm.trim();

  // Fetch search results
  // const searchResults = useQuery(
  //   api.search.searchUsersByTerm,
  //   isAuthenticated && trimmedSearchTerm ? { 
  //     searchTerm: trimmedSearchTerm 
  //   } : "skip"
  // );

  // Fetch Name and Username search results in Search Area
  const userResults = useQuery(
    api.search.searchUsersByTerm,
    isAuthenticated && trimmedSearchTerm
      ? { searchTerm: trimmedSearchTerm }
      : "skip"
  );

  // Fetch Tag search results in Search Area
  const tagResults = useQuery(
    api.search.searchTagsByTerm,
    isAuthenticated && trimmedSearchTerm
      ? { searchTerm: trimmedSearchTerm }
      : "skip"
  );
    
  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? {} : "skip"
  );
  
  const createConversation = useMutation(api.conversations.createConversation);
  
  // Handle user selection from search results
  const handleSelectUser = async (selectedUser: UserType) => {  
    if (!currentUserId || !me) return;

    // Check if a conversation with the selected user already exists
    let existingConversation = conversations?.find((conversation) => {
      if (conversation.isGroup) return false;
      const participantIds = conversation.participants.map((p: UserType) => p._id.toString());
      return (
        participantIds.length === 2 &&
        participantIds.includes(currentUserId.toString()) &&
        participantIds.includes(selectedUser._id.toString())
      );
    });

    if (existingConversation) {
      // Open existing conversation
      setSelectedConversation(existingConversation);
      setIsViewingConversation(true);
    } else {
      try {
        // Create a new conversation in the backend
        const newConversation = await createConversation({
          participants: [currentUserId, selectedUser._id], // Include both users
          isGroup: false,
        });
        // Compute name and image in the frontend
        const conversationName = selectedUser.name || "Unknown User";
        const conversationImage = selectedUser.image || "/placeholder.png";

        // Set the conversation with name and image
        const conversationWithDetails: ConversationType = {
          ...newConversation,
          name: conversationName,
          image: conversationImage,
          unreadMessageCount: 0,
        };
      // Set the temporary conversation as the selected conversation
      setSelectedConversation(conversationWithDetails);
      setIsViewingConversation(true);
    } catch (error) {
      console.error("Error creating conversation:", error);
      // Handle error appropriately, e.g., show a toast notification
    }
  }

    // Clear the search term to close the search results
    setSearchTerm("");
   };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    // Navigate to the tag results page with the tag as a dynamic route
    router.push(`/tags/${encodeURIComponent(tag)}`);
    // Alternatively, set a state to display tag results within the component
    
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-base pl-10 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary transition-colors duration-200"
        />
      </div>
      {isAuthenticated && trimmedSearchTerm && (
        <div className="absolute mt-1 w-full bg-background border rounded shadow z-20">
          {/* Section One: User Results */}
          {userResults && userResults.length > 0 && (
            <div>
              {userResults.slice(0, 5).map((user: UserType) => (
              <div
                key={user._id}
                className="flex items-center p-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSelectUser(user)}
              >
                <Avatar className="mr-2">
                  <AvatarImage src={user.image || "/placeholder.png"} alt={user.name} />
                  <AvatarFallback>
                    <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.name}
                  </span>
                  {user.username && (
                    <span className="text-sm text-muted-foreground">
                      @{user.username}
                    </span>
                  )}
                </div>
              </div>
              ))}
              {userResults.length > 2 && (
                <div className="text-center mt-2">
                  <button 
                    onClick={() => 
                      router.push(
                        `/search/users?term=${encodeURIComponent(
                          trimmedSearchTerm
                        )}`
                      )
                    }>
                    See more results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          <hr className="my-2" />

          {/* Section Two: Tag Results */}
          {tagResults && tagResults.length > 0 && (
            <div className="flex flex-col mt-1 mb-3">
              <div className="flex flex-wrap ml-3">
                {tagResults.slice(0, 6).map((tag: string, index: number) => (
                  <span 
                    key={index} 
                    className="mr-1 mt-1 px-2 py-1 bg-gray-800 text-sm rounded-full cursor-pointer hover:bg-accent"
                    onClick={() => handleTagClick(tag)}
                  >
                    #{tag}
                  </span>
                  
                ))}
              </div>
              {tagResults.length > 6 && (
                <div className="text-center mt-2 mb-2">
                  <button 
                    onClick={() => 
                      router.push(
                        `/search/tags?term=${encodeURIComponent(
                          trimmedSearchTerm
                        )}`
                      )
                    }
                  >
                    See more tags
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUsers;

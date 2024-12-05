// src/app/tags/[tag]/page.tsx

"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { ConversationType, UserType, convertConversationTypes } from "@/utils/conversation_utils";
import { Id } from "../../../../convex/_generated/dataModel";
import { User } from "@clerk/clerk-sdk-node";

const TagResultsPage = () => {
  const router = useRouter();
  const params = useParams();
  const tag = params?.tag || "";

  const { isAuthenticated, isLoading } = useConvexAuth();

  const tagResults = useQuery(
    api.search.searchUsersByTag,
    isAuthenticated && tag ? { tag: tag as string } : "skip"
  );

  // const validTagResults = tagResults?.filter((user): user is UserType => user !== null) || [];
  const validTagResults = (tagResults?.filter((user) => user !== null) || []) as UserType[];

  // const tagResults = useQuery(
  //   api.search.searchUsersByTag,
  //   isAuthenticated && tag ? { tag } : "skip"
  // );

  const { setSelectedConversation, setIsViewingConversation } = useConversationStore();

  // Conditionally call useQuery based on authentication status
  const me = useQuery(
    api.users.getMe, isAuthenticated ? {} : "skip"
  );
  const currentUserId = me?._id;

  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? {} : "skip"
  );

  const createConversation = useMutation(api.conversations.createConversation);
  
  // const handleSelectUser = async (selectedUser: any) => {
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
      router.push("/"); // Navigate back to the chat page
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
        router.push("/"); // Navigate back to the chat page
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    }
    
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Users tagged with #{tag}</h1>
      
      {!tagResults ? (
        <p>Loading...</p>
      ) : validTagResults.length > 0 ? (
        validTagResults.map((user: UserType) => (
        <div
          key={user._id.toString()}
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
      ))
    ) : (
      <p>No users found with the tag &quot;{tag}&quot;.</p>
    )}
  </div>
  );
};

export default TagResultsPage;

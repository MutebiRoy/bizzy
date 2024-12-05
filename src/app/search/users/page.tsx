// src/app/search/users/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { ConversationType, UserType, convertConversationTypes } from "@/utils/conversation_utils";

const UsersSearchPage = () => {
	const searchParams = useSearchParams();
	const searchTerm = searchParams?.get("term") || "";
	const router = useRouter();

  	const { isAuthenticated } = useConvexAuth();

	const userResults = useQuery(
		api.search.searchUsersByTerm,
		isAuthenticated && searchTerm ? { searchTerm } : "skip"
	);

  	const { setSelectedConversation, setIsViewingConversation } =
    useConversationStore();

	const me = useQuery(
		api.users.getMe, isAuthenticated ? {} : "skip"
	);
	const currentUserId = me?._id;

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
		router.push("/");
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
			router.push("/"); // Navigate back to the chat pages

		} catch (error) {
			console.error("Error creating conversation:", error);
			// Handle error appropriately, e.g., show a toast notification
		}
	}
};

return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Users matching "{searchTerm}"</h1>
      {userResults && userResults.length > 0 ? (
        userResults.map((user: UserType) => (
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
                {user.name || user.username || "Unknown User"}
              </span>
              {user.username && (
                <span className="text-sm text-muted-foreground">@{user.username}</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No users found matching "{searchTerm}".</p>
      )}
    </div>
  );
};

export default UsersSearchPage;

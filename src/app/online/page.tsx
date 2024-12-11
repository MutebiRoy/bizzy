// src/app/online/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { Search, Home } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserType, ConversationType, convertConversationTypes } from "@/utils/conversation_utils";

export default function OnlinePage() {

  const [searchTerm, setSearchTerm] = useState("");
  // If user has a preferredGender in `me`, use that. Otherwise default to "all genders"
  const [preferredGender, setPreferredGender] = useState("all genders");
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();

  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const { setSelectedConversation, setIsViewingConversation } = useConversationStore();

  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
  const onlineUsers = useQuery(api.users.getOnlineUsers, isAuthenticated ? {} : "skip") ?? [];
  const userResults = useQuery(api.search.searchUsersByTerm, (isAuthenticated && me && me._id) ? { searchTerm: "" } : "skip") ?? [];
  const conversations = useQuery(api.conversations.getMyConversations, isAuthenticated ? {} : "skip");
  const updateProfile = useMutation(api.users.updateProfile);
  const createConversation = useMutation(api.conversations.createConversation);

  // Fetch all genders from genders table
  const dynamicGenders = useQuery(api.users.getAllGenders, isAuthenticated ? {} : "skip") ?? [];

  // After we have me, if me has a preferredGender, update state
  useEffect(() => {
    if (me && me.preferredGender) {
      setPreferredGender(me.preferredGender.toLowerCase());
    }
  }, [me]);

  if (!isAuthenticated) {
    return <p className="text-center">Please log in to see online users.</p>;
  }

  // If authenticated but me not loaded yet
  if (!me) {
    return <p className="text-center">Loading...</p>;
  }

  if (!me._id) {
    return <p className="text-center">Please log in to see online users.</p>;
  }

  // Combine standard genders with fetched ones
  // Start with "all genders"
  //let genderOptions = ["all genders"];

  // Combine standard genders with fetched ones
  const standardGenders = ["male", "female", "prefer not to say"];
  const combined = new Set([...standardGenders, ...dynamicGenders.map(g => g.toLowerCase())]);
  const genderOptions = ["all genders", ...Array.from(combined)];

  let filteredUsers: UserType[] = onlineUsers;

  if (trimmedSearchTerm) {
    const userResultsMap = new Map(userResults.map((u: UserType) => [u._id.toString(), u]));
    filteredUsers = filteredUsers.filter((u: UserType) => userResultsMap.has(u._id.toString()));
  }

  // Filter by preferredGender if not "All genders"
  if (preferredGender !== "all genders") {
    filteredUsers = filteredUsers.filter((u: UserType) => {
      if (!u.gender) return false;
      return u.gender.toLowerCase() === preferredGender.toLowerCase();
    });
  }

  const handleSelectUser = async (selectedUser: UserType) => {
  
    let existingConversation = conversations?.find((conversation) => {
      if (conversation.isGroup) return false;
      const participantIds = conversation.participants.map((p: UserType) => p._id.toString());
      return (
      participantIds.length === 2 &&
      participantIds.includes(me._id.toString()) &&
      participantIds.includes(selectedUser._id.toString())
      );
  });

    if (existingConversation) {
      setSelectedConversation(existingConversation);
      setIsViewingConversation(true);
      router.push("/");
    } else {
      try {
        const newConversation = await createConversation({
          participants: [me._id, selectedUser._id], // Include both users
				  isGroup: false,
        });

        const conversationName = selectedUser.name || "Unknown User";
        const conversationImage = selectedUser.image || "/placeholder.png";

        const conversationWithDetails: ConversationType = {
          ...newConversation,
          name: conversationName,
          image: conversationImage,
          unreadMessageCount: 0,
        };
        setSelectedConversation(conversationWithDetails);
        setIsViewingConversation(true);
        router.push("/"); // Navigate back to the chat pages

      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    }
    setSearchTerm("");
  };

  const handlePreferredGenderChange = async (newGender: string) => {
    const lowered = newGender.toLowerCase();
    setPreferredGender(lowered);
    try {
      await updateProfile({
        name: me.name || "",
        username: me.username || "",
        instagramHandle: me.instagramHandle || "",
        tiktokHandle: me.tiktokHandle || "",
        youtubeHandle: me.youtubeHandle || "",
        tags: me.tags || [],
        gender: me.gender || "prefer not to say",
        preferredGender: lowered,
      });
    } catch (error) {
      console.error("Failed to update preferred gender", error);
    }
  };

  // Static known genders for filtering:
  //const genderOptions = ["all genders", "male", "female", "prefer not to say"];

  return (
  <div className="flex flex-col min-h-screen">
    <div className="flex flex-col p-4 space-y-4 flex-grow">
      <h1 className="text-xl font-bold text-center">Online users</h1>
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name, username, tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-base pl-10 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary transition-colors duration-200"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label>Filter by </label>
        <select
          value={preferredGender}
          onChange={(e) => handlePreferredGenderChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {genderOptions.map((g, idx) => (
            <option key={idx} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user: UserType) => (
            <div
              key={user._id.toString()}
              className="flex gap-2 items-center p-2 hover:bg-accent cursor-pointer"
              onClick={() => handleSelectUser(user)}
            > 
            <Avatar className="border border-gray-900 overflow-visible relative mr-2 mt-0">
            <div className='absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground' />
                <AvatarImage src={user.image || "/placeholder.png"} alt={user.name} className='object-cover rounded-full' />
                <AvatarFallback>
                  <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                {user.username && (
                  <span className="text-sm text-muted-foreground">@{user.username}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center">No users found.</p>
      )}
    </div>
    {/* Footer with Home icon pinned at the bottom */}
    <footer className="p-4 flex justify-center items-center">
      <button
        onClick={() => router.push("/")}
        aria-label="Home"
      >
        <Home className="w-6 h-6" />
      </button>
    </footer>
  </div>
  );
}

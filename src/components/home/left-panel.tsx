"use client";
import { useState } from "react";
import { ListFilter, Search, ChevronLeft } from "lucide-react";
import { Input } from "../ui/input";
import ThemeSwitch from "./theme-switch";
import Conversation from "./conversation";
import { UserButton } from "@clerk/nextjs";

import UserListDialog from "./user-list-dialog";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
import { useConversationStore } from "@/store/chat-store";
import RightPanel from "./right-panel"; // Import RightPanel component

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GroupMembersDialog from "./group-members-dialog";

const LeftPanel = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const conversations = useQuery(api.conversations.getMyConversations, isAuthenticated ? undefined : "skip");

    const { selectedConversation, setSelectedConversation } = useConversationStore();
  
    const [isViewingConversation, setIsViewingConversation] = useState(false);

    const conversationName = selectedConversation?.groupName || selectedConversation?.name || "No conversation selected";
    const conversationImage = selectedConversation?.groupImage || selectedConversation?.image || "/default-avatar.png";

    useEffect(() => {
        const conversationIds = conversations?.map((conversation) => conversation._id);
        if (selectedConversation && conversationIds && !conversationIds.includes(selectedConversation._id)) {
        setSelectedConversation(null);
        }
    }, [conversations, selectedConversation, setSelectedConversation]);

    if (isLoading) return null;

    const handleBackClick = () => {
        setIsViewingConversation(false);
        setSelectedConversation(null);
    };

    const handleConversationClick = (conversation) => {
        setSelectedConversation(conversation);
        setIsViewingConversation(true);
    };

    return (
        <div className='w-full overflow-hidden h-screen'>
            <div className='fixed top-0 left-0 right-0 bg-left-panel z-10 '>
                <div className='flex justify-between bg-gray-primary p-3'>
                    {isViewingConversation ? (
                    <div className='flex items-center'>
                        <button onClick={handleBackClick}>
                            <ChevronLeft size={24} />
                        </button>
                        <Avatar className='ml-4'>
                            <AvatarImage src={conversationImage || "/placeholder.png"} className='object-cover' />
                            <AvatarFallback>
                            <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full' />
                            </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col ml-4'>
                            <p>{conversationName}</p>
                            {selectedConversation.isGroup && (
                            <GroupMembersDialog selectedConversation={selectedConversation} />
                            )}
                        </div>
                    </div>
                    ) : (
                        <UserButton />
                    )}
                    <div className='flex items-center gap-3'>
                        {isAuthenticated && <UserListDialog />}
                        <ThemeSwitch />
                    </div>
                </div>
                {!isViewingConversation && (
                <div className='p-3 flex items-center'>
                    <div className='relative h-10 mx-3 flex-1'>
                    <Search
                        className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10'
                        size={18}
                    />
                    <Input
                        type='text'
                        placeholder='Search or start a new chat'
                        className='pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent'
                    />
                    </div>
                </div>
                )}
            </div>
            <div className={`my-3 flex flex-col gap-0 overflow-auto h-full pb-[44px] ${!isViewingConversation ? 'pt-[114px]' : 'pt-[78px]'}`}>
                {!isViewingConversation &&
                    conversations?.map((conversation, index) => (
                    <div className={index === 0 ? 'pt-[0px]' : ''} key={conversation._id}>
                        <Conversation
                            key={conversation._id}
                            conversation={conversation}
                            onClick={() => handleConversationClick(conversation)}
                        />
                    </div>
                ))}
                {isViewingConversation && selectedConversation && (
                <div className='overflow-auto h-full'>
                    <RightPanel conversation={selectedConversation} />
                </div>
                )}
                {conversations?.length === 0 && !isViewingConversation && (
                <>
                    <p className='text-center text-gray-500 text-sm mt-3'>No conversations yet!</p>
                    <p className='text-center text-gray-500 text-sm mt-3'>
                        Click on any name to start a conversation
                    </p>
                </>
                )}
            </div>
        </div>
    );
};

export default LeftPanel;

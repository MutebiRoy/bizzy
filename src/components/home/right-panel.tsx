"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
//import { api } from "../../../convex/_generated/api";
import { useConversationStore, ConversationType } from "@/store/chat-store";
import MessageContainer from "./message-container";
import MessageInput from "./message-input";

interface RightPanelProps {
    conversation: ConversationType | null;  // Use ConversationType or null
}

const RightPanel = ({ conversation }: RightPanelProps) => {
    const { selectedConversation, setSelectedConversation } = useConversationStore();
    
    // Only attempt to fetch messages if a conversation is selected
    //const messages = useQuery(api.messages.getMessages, { conversation: conversation?._id! });

    useEffect(() => {
        if (conversation) {
            setSelectedConversation(conversation);
        }
    }, [conversation, setSelectedConversation]);

    if (!conversation) {
        return null;  // Return null if no conversation is selected
    }

    return (
        <div className='w-full'>
            <div className='flex flex-col h-full'>
                <div className='flex-grow overflow-hidden'>
                    <MessageContainer/>
                </div>
                <div className='flex-shrink-0 fixed bottom-0 left-0 right-0 z-10 '>
                    <MessageInput conversation={conversation} />
                </div>
            </div>
        </div>
    );
};
export default RightPanel;

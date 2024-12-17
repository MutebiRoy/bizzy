// src/components/home/right-panel.tsx"
"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useConversationStore } from "@/store/chat-store";
import MessageContainer from "./message-container";
import MessageInput from "./message-input";
import { ConversationType} from "@/utils/conversation_utils";

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
        <div className='flex flex-col h-full relative'>
            <div className='flex-1 overflow-y-auto pb-[80px]'>
                <MessageContainer/>
            </div>

            <footer className='fixed bottom-0 left-0 w-full bg-white z-20'>
                <div className="p-0">
                    <MessageInput conversation={conversation} />
                </div>
            </footer>
        </div>
    );
};
export default RightPanel;

import ChatBubble from "./chat-bubble";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore, IMessage  } from "@/store/chat-store";
import { useEffect, useRef } from "react";
import { ConversationType, UserType } from "@/utils/conversation_utils";


const MessageContainer = () => {
	const { selectedConversation } = useConversationStore();
	const messages = useQuery(
        api.messages.getMessages,
        selectedConversation && selectedConversation._id
          ? { conversation: selectedConversation._id }
          : "skip"
    );
	const me = useQuery(api.users.getMe);
	const lastMessageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTimeout(() => {
			lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	}, [messages]);

	return (
		<div className='relative p-3 flex-1 overflow-auto bg-chat-tile-light dark:bg-chat-tile-dark'>
            <div className='flex flex-col overflow-hidden w-full gap-3'>
                {messages?.map((msg, idx) => (
                    <div key={msg._id} ref={lastMessageRef}>
                        {/* Convert _creationTime to ISO string before passing to ChatBubble */}
                        <ChatBubble
                            message={{
                                ...msg,
                                _creationTime: new Date(msg._creationTime).toISOString()
                            }}
                            me={me}
                            previousMessage={idx > 0 ? {
                                ...messages[idx - 1],
                                _creationTime: new Date(messages[idx - 1]._creationTime).toISOString()
                            } : undefined}
                        />
                    </div>
                ))}
            </div>
        </div>
	);
};
export default MessageContainer;

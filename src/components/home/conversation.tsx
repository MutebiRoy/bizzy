import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageSeenSvg } from "@/lib/svgs";
import { ImageIcon, Users, VideoIcon } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { ConversationType } from "@/utils/conversation_utils";

// Define the type for the conversation prop
interface ConversationProps {
  conversation: ConversationType;
  onClick: (conversation: any) => void;
}

const Conversation: React.FC<ConversationProps> = ({ conversation, onClick }) => {
  const { isAuthenticated } = useConvexAuth();
  const conversationImage = conversation.groupImage || conversation.image;
  const conversationName = conversation.groupName || conversation.name;
  const lastMessage = conversation.lastMessage;
  const lastMessageType = lastMessage?.messageType;
  const me = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );
  
  const { setSelectedConversation, selectedConversation } = useConversationStore();
  const activeBgClass = selectedConversation?._id === conversation._id;

  if (!isAuthenticated || !me) {
    // Show a loading state, redirect, or return null
    return null;
  }
  
  return (
    <div
      className={`flex gap-2 items-center p-3 hover:bg-chat-hover cursor-pointer
                ${activeBgClass ? "bg-gray-tertiary" : ""}
            `}
      onClick={() => onClick(conversation)}
    >
      <Avatar className='border border-gray-900 overflow-visible relative'>
        {conversation.isOnline && (
          <div className='absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground' />
        )}
        <AvatarImage src={conversationImage || "/placeholder.png"} className='object-cover rounded-full' />
        <AvatarFallback>
          <div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
        </AvatarFallback>
      </Avatar>
      <div className='w-full'>
        <div className='flex items-center'>
          <h3 className='text-sm font-medium'>{conversationName}</h3>
          <span className='text-xs text-gray-500 ml-auto'>
            {formatDate(Number(lastMessage?._creationTime) || Number(conversation._creationTime))}
          </span>
        </div>
        <p className='text-[12px] mt-1 text-gray-500 flex items-center gap-1 '>
          {lastMessage?.sender === me?._id ? <MessageSeenSvg /> : ""}
          {conversation.isGroup && <Users size={16} />}
          {!lastMessage && "Say Hi!"}
          {lastMessageType === "text" ? (
            lastMessage?.content && lastMessage.content.length > 30 ? (
              <span>{lastMessage.content.slice(0, 30)}...</span>
            ) : (
              <span>{lastMessage?.content}</span>
            )
          ) : null}
          { lastMessageType === "image" && <ImageIcon size={16} /> }
          { lastMessageType === "video" && <VideoIcon size={16} /> }
        </p>
      </div>
    </div>
  );
};


export default Conversation;

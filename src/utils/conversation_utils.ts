//"C:\Users\mutebi\Desktop\bizmous\src\utils\conversation_utils.ts"
import { Id } from "../../convex/_generated/dataModel";

export type UserType = {
  _id: Id<"users">;
  _creationTime: number | string;
  name?: string;
  email: string;
  image: string;
  imageStorageId?: Id<"_storage">;
  tokenIdentifier: string;
  isOnline: boolean;
  username?: string;
  instagramHandle?: string,
  tiktokHandle?: string;
  youtubeHandle?: string;
};

// Define the Conversation type as returned from the backend
export type Conversation = {
  _id: string; // IDs from backend are strings
  _creationTime: number | string;
  //participants: string[]; // IDs as strings
  //participants: any[]; 
  participants: UserType[];
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  admin?: string;
  lastMessage?: {
    _id: string;
    _creationTime: number | string;
    conversation: string;
    sender: string;
    content: string;
    messageType: "text" | "image" | "video";
  };
  name: string;
  image?: string;
  isLastMessageSeen?: boolean;
  unreadMessageCount?: number | undefined;
  initiator?: string;
  username?: string;
};

// Define the ConversationType expected in the frontend
export type ConversationType = {
  _id: Id<"conversations"> | null;
  groupName?: string;
  participants: Id<"users">[] | UserType[] | (UserType | null)[];
  isGroup: boolean;
  username?: string;
	groupImage?: string;
  admin?: Id<"users">;
  isOnline?: boolean;
  isTemporary?: boolean;
  _creationTime: number | string;  // This should be string
  lastMessage?: {
    _id: Id<"messages">;
    conversation: Id<"conversations">;
    content: string;
    sender: string;
    _creationTime: number | string;
    messageType: "image" | "text" | "video";
  };
  name: string;
  image?: string;
  unreadMessageCount: number;
  isLastMessageSeen?: boolean;
  initiator?: string;
};

export function convertConversationTypes(
  conversation: Conversation,
  currentUserId: Id<"users">
): ConversationType {
  const convertedConversation: ConversationType = {
    _id: conversation._id as Id<"conversations">,
    _creationTime: conversation._creationTime.toString(),
    participants: conversation.participants
    ? conversation.participants as UserType[]
    : [],

    isGroup: conversation.isGroup,
    admin: conversation.admin ? (conversation.admin as Id<"users">) : undefined,
    initiator: conversation.initiator ? (conversation.initiator as Id<"users">) : undefined,
    lastMessage: conversation.lastMessage
      ? {
          _id: conversation.lastMessage._id as Id<"messages">,
          _creationTime: conversation.lastMessage._creationTime.toString(),
          conversation: conversation.lastMessage.conversation as Id<"conversations">,
          sender: conversation.lastMessage.sender,
          content: conversation.lastMessage.content,
          messageType: conversation.lastMessage.messageType,
        }
      : undefined,
    name: conversation.name,
    image: conversation.image,
    unreadMessageCount: conversation.unreadMessageCount || 0,
    isLastMessageSeen: conversation.isLastMessageSeen || false,
  };

  // Set isOnline based on other participant for one-to-one conversations
  if (!conversation.isGroup && conversation.participants) {
    const otherParticipant = conversation.participants.find(
      (participant) => participant._id !== currentUserId
    );
    if (otherParticipant) {
      convertedConversation.isOnline = otherParticipant.isOnline;
    }
  }

  return convertedConversation;
}




interface SharedConversation {
    _id: Id<"conversations">;
    _creationTime: number;
    participants: (UserType | null)[];
    isGroup: boolean;
    groupName?: string;
    groupImage?: string;
    admin?: Id<"users">;
    name?: string;
    image?: string;
    isOnline?: boolean;
    lastMessage?: {
      _id: Id<"messages">;
      _creationTime: number;
      conversation: Id<"conversations">;
      sender: string;
      content: string;
      messageType: "text" | "image" | "video";
    };
    [key: string]: any;
}
  
interface User {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email: string;
  image: string;
  imageStorageId?: Id<"_storage">;
  tokenIdentifier: string;
  isOnline: boolean;
  username?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
}

// interface ConversationWithParticipants extends Conversation {
//   participants: User[];
// }

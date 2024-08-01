import { Id } from "../../convex/_generated/dataModel";
import { create } from "zustand";

export type ConversationType = {
    _id: Id<"conversations">;
    groupName?: string;
    image?: string;
    participants: Id<"users">[];
    isGroup: boolean;
    name?: string;
	groupImage?: string;
    admin?: Id<"users">;
    isOnline?: boolean;
    _creationTime: string;  // This should be string
    lastMessage?: {
        _id: Id<"messages">;
        conversation: Id<"conversations">;
        content: string;
        sender: string;
        _creationTime: string;
        messageType: "image" | "text" | "video";
    };
};

type ConversationStore = {
	selectedConversation: ConversationType | null;
	setSelectedConversation: (conversation: ConversationType | null) => void;
	isViewingConversation: boolean;
	setIsViewingConversation: (isViewing: boolean) => void;  // Explicitly define boolean type here
};

export const useConversationStore = create<ConversationStore>((set) => ({
    selectedConversation: null,
    setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
    isViewingConversation: false,
    setIsViewingConversation: (isViewing: boolean) => set({ isViewingConversation: isViewing }),  // Ensure isViewing is typed as boolean
  }));

export interface IMessage {
	_id: string;
	content: string;
	_creationTime: string;
	messageType: "text" | "image" | "video";
	sender: {
		_id: Id<"users">;
		image: string;
		name?: string;
		tokenIdentifier: string;
		email: string;
		_creationTime: string;
		isOnline: boolean;
	};
}

import { ConversationType } from "@/utils/conversation_utils";
import { Id } from "../../convex/_generated/dataModel";
import { create } from "zustand";

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
	//sender_id: Id<"users">;
	//_id: string;
	_id: Id<"messages">;
	content: string;
	_creationTime: string | number;
	//conversation: string;
	conversation: Id<"conversations">;
	messageType: "text" | "image" | "video";
	sender: {
		_id: Id<"users">;
		image: string;
		name?: string;
		tokenIdentifier: string;
		email: string;
		_creationTime: string | number;
		isOnline: boolean;
	};
}

import { IMessage, useConversationStore } from "@/store/chat-store";
import { useMutation } from "convex/react";
import { Ban, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import React from "react";
import { UserType } from "@/utils/conversation_utils";

type ChatAvatarActionsProps = {
	message: IMessage;
	me: any;
};

const ChatAvatarActions = ({ me, message }: ChatAvatarActionsProps) => {
	const { selectedConversation, setSelectedConversation } = useConversationStore();

	// First, ensure that participants is an array of UserType, filtering out nulls
	const participantIds = selectedConversation?.participants
	.filter((participant): participant is UserType => participant !== null)
	.map((participant) => participant._id);

	// Now, check if the message sender's ID is in the array of participant IDs
	const isMember = participantIds?.includes(message.sender._id);
	const kickUser = useMutation(api.conversations.kickUser);
	const createConversation = useMutation(api.conversations.createConversation);
	const isGroup = selectedConversation?.isGroup;

	const handleKickUser = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!selectedConversation || !selectedConversation._id) return;
		try {
			await kickUser({
				conversationId: selectedConversation._id,
				userId: message.sender._id,
			});

			setSelectedConversation({
				...selectedConversation,
				participants: selectedConversation.participants
				  .filter((participant): participant is UserType => participant !== null)
				  .filter((participant) => participant._id !== message.sender._id),
			});
		} catch (error) {
			toast.error("Failed to kick user");
		}
	};

	const handleCreateConversation = async () => {

		try {
			const conversation = await createConversation({
				isGroup: false,
				participants: [me._id, message.sender._id],
			});

			setSelectedConversation({
				_id: conversation._id,
				name: message.sender.name,
				participants: [me._id, message.sender._id],
				isGroup: false,
				isOnline: message.sender.isOnline,
				image: message.sender.image,
				_creationTime: new Date().toISOString(),
			});
		} catch (error) {
			toast.error("Failed to create conversation");
		}
	};

	return (
		<div
			className='text-[11px] flex gap-4 justify-between font-bold cursor-pointer group'
			onClick={handleCreateConversation}
		>
			{isGroup && message.sender.name}

			{!isMember && <Ban size={16} className='text-red-500' />}
			{isGroup && isMember && selectedConversation?.admin === me._id && (
				<LogOut size={16} className='text-red-500 opacity-0 group-hover:opacity-100' onClick={handleKickUser} />
			)}
		</div>
	);
};
export default ChatAvatarActions;

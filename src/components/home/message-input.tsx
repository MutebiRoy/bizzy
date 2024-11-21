import { Laugh, Mic, Plus, Send } from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { ConversationType, UserType } from "@/utils/conversation_utils";
import toast from "react-hot-toast";
import useComponentVisible from "@/hooks/useComponentVisible";
import EmojiPicker, { Theme } from "emoji-picker-react";
import MediaDropdown from "./media-dropdown";
import { Id } from "../../../convex/_generated/dataModel";


interface MessageInputProps {
	conversation: ConversationType;  // Ensure this matches how you have defined ConversationType
}

const MessageInput: React.FC<MessageInputProps> = ({ conversation }) => {
	const { isAuthenticated } = useConvexAuth();
	const [msgText, setMsgText] = useState("");
	const { 
		selectedConversation, 
		setSelectedConversation 
	} = useConversationStore();
	const { 
		ref, 
		isComponentVisible, 
		setIsComponentVisible 
	} = useComponentVisible( false );

	const me = useQuery(
		api.users.getMe,
		isAuthenticated ? {} : "skip"
	);

	const sendTextMsg = useMutation(api.messages.sendTextMessage);
	const createConversation = useMutation(api.conversations.createConversation);

	if (!isAuthenticated || !me) {
		// Show a loading state, redirect, or return null
		return null;
	}
	
	const handleSendTextMsg = async (e: React.FormEvent) => {
		e.preventDefault();

		 // Input Validation
		if (msgText.trim().length === 0) {
			toast.error("Message cannot be empty.");
			return; // Don't submit the form
		}

		if (msgText.length > 300) {
			toast.error("Message should be less than 300 character!");
			return; // Don't submit the form
		}

		// Verify conversation and user data existence
		if (!selectedConversation || !me) {
			toast.error("Invalid conversation or user data.");
			return;
		}
		
		try {
			let conversationId = selectedConversation?._id;
	  
			// Check if this is a temporary conversation
			if (!conversationId) {
				const participantIds = selectedConversation!.participants
				.filter((user): user is UserType => user !== null)
				.map((user) => user._id);

			  	// Create a new conversation in the backend
			  	const conversation = await createConversation({
					participants: participantIds,
					isGroup: false,
				});

			  	conversationId = conversation._id;
			  
			  	// Update selectedConversation
				const updatedConversation: ConversationType = {
					...selectedConversation!,
					...conversation,
					isTemporary: false, // Remove the temporary flag
				};
				setSelectedConversation(updatedConversation);
			}
	  
			// Send the message
			await sendTextMsg({
				content: msgText,
				conversationId: conversationId as Id<"conversations">,
			  	sender: me!._id,
			});
			setMsgText("");
		  } catch (err: any) {
			toast.error(err.message);
			toast.error("An unexpected error occurred. Please try again.");
		  }
		};

	return (
		<div className="message-input-container">
			<div className='bg-gray-primary p-2 flex gap-4 items-center'>
				<div className='relative flex gap-2 ml-2'>
					{/* EMOJI PICKER WILL GO HERE */}
					<div ref={ref} onClick={() => setIsComponentVisible(true)}>
						{isComponentVisible && (
							<EmojiPicker
								theme={Theme.DARK}
								onEmojiClick={(emojiObject) => {
									setMsgText((prev) => prev + emojiObject.emoji);
								}}
								style={{ position: "absolute", bottom: "1.5rem", left: "1rem", zIndex: 50 }}
							/>
						)}
						<Laugh className='text-gray-600 dark:text-gray-400' />
					</div>
					<MediaDropdown />
				</div>
				<form onSubmit={handleSendTextMsg} className='w-full flex gap-3'>
					<div className='flex-1'>
						<Input
							type='text'
							placeholder='Type a message'
							className='text-base py-2 w-full border rounded-md focus:outline-none focus:ring'
							value={msgText}
							onChange={(e) => setMsgText(e.target.value)}
						/>
					</div>
					<div className='mr-4 flex items-center gap-3'>
						{msgText.length > 0 ? (
							<Button
								type='submit'
								size={"sm"}
								className='bg-transparent text-foreground hover:bg-transparent'
							>
								<Send />
							</Button>
						) : (
							<Button
								type='submit'
								size={"sm"}
								className='bg-transparent text-foreground hover:bg-transparent'
							>
								<Send />
							</Button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
};
export default MessageInput;

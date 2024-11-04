import React, { useState } from "react";
import { MessageSeenSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import ChatBubbleAvatar from "./chat-bubble-avatar";
import DateIndicator from "./date-indicator";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription } from "../ui/dialog";
import ReactPlayer from "react-player";
import ChatAvatarActions from "./chat-avatar-actions";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { ConversationType, UserType } from "@/utils/conversation_utils";

type ChatBubbleProps = {
	message: IMessage;
	me: any;
	previousMessage?: IMessage;
};

const ChatBubble = ({ me, message, previousMessage }: ChatBubbleProps) => {
	// const me = useQuery(api.users.getMe);
	const date = new Date(message._creationTime);
	const hour = date.getHours().toString().padStart(2, "0");
	const minute = date.getMinutes().toString().padStart(2, "0");
	const time = `${hour}:${minute}`;

	const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

	const { selectedConversation } = useConversationStore();
	const participants = (selectedConversation?.participants ?? []).filter((user): user is UserType => user !== null);
	const participantIds = participants.map((user: UserType) => user._id);

  // Check if the message sender is a member
  	const isMember = participantIds.includes(message.sender?._id);
	const isGroup = selectedConversation?.isGroup;
	const fromMe = message.sender?._id === me._id;
	const bgClass = fromMe ? "bg-green-chat" : "bg-white dark:bg-gray-primary";

	console.log(message.sender);
	
	const [open, setOpen] = useState(false);
  	const [thumbnailWidth, setThumbnailWidth] = useState(300);  // State for thumbnail width
  	const [thumbnailHeight, setThumbnailHeight] = useState(200); // State for thumbnail height


  	const handleMediaClick = () => {
    	setOpen(true); // Open the modal

		// Increase thumbnail size when the modal is open (optional)
		setThumbnailWidth(500);
		setThumbnailHeight(300);
  	};

	const handleModalClose = () => {
		setOpen(false); // Close the modal

		// Reset thumbnail size when the modal is closed (optional)
		setThumbnailWidth(300);
		setThumbnailHeight(200);
	};

	const renderMessageContent = () => {
		switch (message.messageType) {
		  case "text":
			return <TextMessage message={message} />;
		  case "image":
			return (
				/* Received Images */
				<div className="w-[100%] h-[100%] m-2 relative">
					<Image
						src={message.content}
						alt="Sent Image"
						width={thumbnailWidth} // Use thumbnailWidth state
						height={thumbnailHeight} // Use thumbnailHeight state
						onClick={handleMediaClick} 
					/>
					{/* Modal for the full-screen image */}
					<Dialog open={open} onOpenChange={handleModalClose} >
						<DialogContent > 
							<DialogDescription style={{ width: '100vw', height: '90vh' }}>
							<Image 
								src={message.content} 
								alt="Image" 
								layout="fill"  
							/>
							</DialogDescription>
						</DialogContent>
					</Dialog>
				</div>
			);
		  case "video":
			return (
				<div className="flex flex-col items-center justify-center h-full pb-2">
					<ReactPlayer
						url={message.content}
						width="200px"
    					height="150px"
						controls={true}
						light={true}
						onClickPreview={handleMediaClick}
					/>
					{/* Modal for the full-screen video */}
					<Dialog open={open} onOpenChange={handleModalClose} >
						<DialogContent > 
							<DialogDescription style={{ width: '100vw', height: '90vh' }}>
							<ReactPlayer
								url={message.content}
								width="80%"
    							height="100%"
								controls={true}
								light={true}
							/>
							</DialogDescription>
						</DialogContent>
					</Dialog>
				</div>
			);
		  default:
			return null;
		}
	};

	if (!fromMe) {
		return (
			<>
				<DateIndicator message={message} previousMessage={previousMessage} />
				<div className='flex gap-1 w-2/3'>
					<ChatBubbleAvatar isGroup={isGroup} isMember={isMember} message={message} />
					<div className={`flex flex-col z-20 pt-3 pr-4 pb-2 relative ${bgClass} rounded-md shadow-md`}>
						<OtherMessageIndicator />
						{isGroup && <ChatAvatarActions message={message} me={me} />}
						{renderMessageContent()}
						{open && <ImageDialog src={message.content} open={open} onClose={() => setOpen(false)} />}
						<MessageTime 
							time={time} fromMe={fromMe}
						/>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<DateIndicator message={message} previousMessage={previousMessage} />
			{/* Sent Image bubble. */}
			<div className='flex gap-1 w-2/3 ml-auto'>
				<div className={`flex flex-col z-20 max-w-fit px-2 pt-1 pr-4 pb-1 rounded-md shadow-md ml-auto relative ${bgClass}`}>
					<SelfMessageIndicator />
					{renderMessageContent()}

					<Dialog open={open} onOpenChange={(isOpen) => {
						if (!isOpen) setOpen(false);
					}} >
						<DialogContent > 
							
							<DialogDescription style={{ width: '100vw', height: '90vh' }}>
							{message.messageType === "image" && (
								<Image
								// Sent and Recieved Images
									src={message.content}
									alt="Sent Image"
									layout="fill" 
								 	//objectFit="contain"
								/>
							)}
							{message.messageType === "video" && (
								<div className="relative w-full h-full">  
									<ReactPlayer
										// Sent and Recieved Videos
										url={message.content}
										width="80%"
										height="100%"
										controls={true}
										light={true}
									/>
								</div>
							)}
							</DialogDescription>
						</DialogContent>
					</Dialog>
					<MessageTime time={time} fromMe={fromMe} />
				</div>
			</div>
		</>
	);
};
export default ChatBubble;

const VideoMessage = ({ message }: { message: IMessage }) => {
	return <ReactPlayer 
	url={message.content} 
	//width='100%' 
	//height='100%' 
	controls={ true } 
	light={ true } 
	muted={ true } 
	pip = { true }
	stopOnUnmount={false}
	/>;
};

const ImageMessage = ({ message, handleClick }: { message: IMessage; handleClick: () => void }) => {
	return (
		<div className='w-[100%] h-[90%] m-2 relative'>
			<Image
				src={message.content}
				
				alt='image'
				onClick={handleClick}
			/>
		</div>
	);
};

const ImageDialog = ({ src, onClose, open }: { open: boolean; src: string; onClose: () => void }) => {
	return (
	  <Dialog open={open} onOpenChange={onClose}>
		<DialogContent> 
		  {/* Center the content within the modal */}
		  <DialogDescription >
			<Image
				src={src} 
				alt="Image"
				layout="fill"
			/>
		  </DialogDescription>
		</DialogContent>
	  </Dialog>
	);
  };

const MessageTime = ({ time, fromMe }: { time: string; fromMe: boolean }) => {
	return (
		<p className='text-[10px] mt-0 self-end flex gap-1 items-center pl-2'>
			{time} {fromMe && <MessageSeenSvg />}
		</p>
	);
};

const OtherMessageIndicator = () => (
	<div className='absolute bg-white dark:bg-gray-primary top-0 -left-[4px] w-3 h-3 rounded-bl-full' />
);

const SelfMessageIndicator = () => (
	<div className='absolute bg-green-chat top-0 -right-[3px] w-3 h-3 rounded-br-full overflow-hidden' />
);

const TextMessage = ({ message }: { message: IMessage }) => {
	const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.content); // Check if the content is a URL

	return (
		<div>
			{isLink ? (
				<a
					href={message.content}
					target='_blank'
					rel='text message'
					className={`mr-2 text-sm font-light text-blue-400 underline`}
				>
					{message.content}
				</a>
			) : (
				<p className={`mr-2 pl-2 text-sm font-light`}>{message.content}</p>
			)}
		</div>
	);
};

// src\components\home\group-members-dialog.tsx
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Crown } from "lucide-react";
import React from "react";
import { useQuery } from "convex/react";
import { ConversationType, UserType } from "@/utils/conversation_utils";
import { api } from "../../../convex/_generated/api";

type GroupMembersDialogProps = {
	selectedConversation: ConversationType;
};

//const GroupMembersDialog = ({ selectedConversation }: GroupMembersDialogProps) => {
	const GroupMembersDialog: React.FC<GroupMembersDialogProps> = ({ selectedConversation }) => {
	const users = useQuery(
		api.users.getGroupMembers, 
		selectedConversation._id ? { conversationId: selectedConversation._id } : "skip"
	);
	return (
		<Dialog>
			<DialogTrigger>
				<p className='text-xs text-muted-foreground text-left'>See members</p>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='my-2'>Current Members</DialogTitle>
					<DialogDescription>
						<div className='flex flex-col gap-3 '>
						{users?.map((user) => (
  user && (
							<div key={user._id} className={`flex gap-3 items-center p-2 rounded`}>
								<Avatar className='overflow-visible'>
									{user?.isOnline && (
										<div className='absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-foreground' />
									)}
									<AvatarImage src={user.image} className='rounded-full object-cover' />
									<AvatarFallback>
										<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
									</AvatarFallback>
								</Avatar>

								<div className='w-full '>
									<div className='flex items-center gap-2'>
										<h3 className='text-md font-medium'>
											{/* johndoe@gmail.com */}
											{user.name || user.email.split("@")[0]}
										</h3>
										{user._id === selectedConversation.admin && (
											<Crown size={16} className='text-yellow-400' />
										)}
									</div>
								</div>
							</div>
							)))}
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};
export default GroupMembersDialog;

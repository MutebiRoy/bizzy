import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getConversationById } from "./getConversationById";
import {
	getAll,
	getOneFrom,
	getManyFrom,
	getManyVia,
  } from "convex-helpers/server/relationships";

interface Conversation {
	_id: Id<"conversations">;
	isGroup: boolean;
	groupName?: string;
	groupImage?: string;
	admin?: Id<"users">;
	participants: any[];
	_creationTime: number | string;
	name: string;
  	image: string;
	initiator?: Id<"users">;
}

export const setConversationLastRead = mutation({
	args: {
	  conversationId: v.id("conversations"),
	},
	handler: async (ctx, { conversationId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		}
  
	  	// Fetch the authenticated user
		const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.unique();
			
	
		if (!user) {
			throw new Error("User not found");
		}
  
	  	const timeNow = Date.now();
  
	  	// Check if a record already exists
	  	const existingRecord = await ctx.db
		.query("user_conversation_reads")
		.withIndex("by_user_and_conversation", (q) =>
		  q.eq("user", user._id).eq("conversation", conversationId)
		)
		.unique();
  
		if (existingRecord) {
			// Update the existing record
			await ctx.db.patch(existingRecord._id, {
			lastReadTime: timeNow,
			});
		} else {
			// Insert a new record
			await ctx.db.insert("user_conversation_reads", {
			user: user._id,
			conversation: conversationId,
			lastReadTime: timeNow,
			});
		}
	  	// Fetch unread messages in this conversation that the user hasn't seen yet
		// const unreadMessages = await ctx.db
		// .query("messages")
		// .withIndex("by_conversation", (q) => q.eq("conversation", conversationId))
		// .filter((q) =>
		// 	q.and(
		// 	q.neq(q.field("sender"), user._id), // Exclude messages sent by the user
		// 	q.not(q.includes(q.field("seenBy"), user._id)) // Messages not yet seen by the user
		// 	)
		// )
		// .collect();

		// // Update each message to add the current user to 'seenBy'
		// for (const message of unreadMessages) {
		// 	await ctx.db.patch(message._id, {
		// 		seenBy: [...(message.seenBy || []), user._id],
		// 	});
		// }

	},
});
  
export const createConversation = mutation({
	args: {
		participants: v.array(v.id("users")),
		isGroup: v.boolean(),
		groupName: v.optional(v.string()),
		groupImage: v.optional(v.id("_storage")),
		admin: v.optional(v.id("users")),
	},
	handler: async (ctx, args): Promise<Conversation> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Unauthorized");

		// Fetch the authenticated user
		const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
		  q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.unique();
  
		if (!user) {
			throw new ConvexError("User not found");
		}

		const participantIds = args.participants;

		 // Check if this is a one-on-one conversation
		if (!args.isGroup && participantIds.length === 2) {
			// Check for existing conversation between these two users
			const existingConversations = await ctx.db
			.query("user_conversations")
			.withIndex("by_user", (q) => 
			q.eq("user", user._id))
			.collect();
			
			for (const userConversation of existingConversations) {
				const conversationId = userConversation.conversation;
				// Fetch participants of this conversation
				const participantsEntries = await ctx.db
				  .query("user_conversations")
				  .withIndex("by_conversation", (q) =>
					q.eq("conversation", conversationId)
				  )
				  .collect();
		
				const participants = participantsEntries.map((entry) => entry.user);
				// Check if participants match
				if (
				  participants.length === 2 &&
				  participants.includes(participantIds[0]) &&
				  participants.includes(participantIds[1])
				) {
					// Existing conversation found
					// Fetch full conversation data
					const existingConversation = await getConversationById(ctx, { conversationId });
					if (existingConversation) {
						// Compute conversation name and image
						let conversationName: string;
						let conversationImage: string;
					
						// For one-on-one conversations, set name and image to the other participant
						const otherParticipant = existingConversation.participants.find(
						  (p) => p !== null && p._id.toString() !== user._id.toString()
						);
						conversationName = otherParticipant?.name || otherParticipant?.email || "Unknown User";
						conversationImage = otherParticipant?.image || "/placeholder.png";
					
						// Return the existing conversation with 'name' and 'image'
						return {
						  ...existingConversation,
						  name: conversationName,
						  image: conversationImage,
						} as Conversation;
					}
				}
			}
		}

		// let groupImage;
		// Assign groupImageUrl
		let groupImageUrl: string | undefined;

		if (args.isGroup && args.groupImage) {
			groupImageUrl = (await ctx.storage.getUrl(args.groupImage)) as string;
		}

		// Insert the conversation
		const conversationId = await ctx.db.insert("conversations", {
			isGroup: args.isGroup,
			groupName: args.groupName,
			groupImage: groupImageUrl,
			admin: args.admin,
			initiator: user._id,
		});
	
		// Insert into user_conversations for each participant
		const userConversationEntries = participantIds.map((participantId) => ({
			user: participantId,
			conversation: conversationId,
		}));

		await Promise.all(
			userConversationEntries.map((entry) =>
				ctx.db.insert("user_conversations", entry)
			)
		);

		// Fetch participant details
		// const participantDetails = await Promise.all(
		// 	participantIds.map((id) => ctx.db.get(id))
		// );
		// Fetch participant details
		const participantDetails = await Promise.all(
			participantIds.map(async (id) => {
			  const participant = await ctx.db.get(id);
			  return participant;
			})
		);

		//let groupImageUrl: string | undefined;

		// if (args.isGroup && args.groupImage) {
		// 	groupImageUrl = (await ctx.storage.getUrl(args.groupImage)) as string;
		// }

		// let conversationName = args.groupName;
		// let conversationImage = groupImage;
		let conversationName: string;
		let conversationImage: string;
	
		if (args.isGroup) {
			// For group conversations, use the group name or default to "Unnamed Group"
			conversationName = args.groupName || "Unnamed Group";
			conversationImage = groupImageUrl || "/default-group-image.png";
		} else {
		  // For one-on-one conversations, set name and image to the other participant
		  const otherParticipant = participantDetails.find(
			//(p) => p._id.toString() !== user._id.toString()
			(p) => p !== null && p._id.toString() !== user._id.toString()
		  );
		  conversationName = otherParticipant?.name || otherParticipant?.email || "Unknown User";
		  conversationImage = otherParticipant?.image || "/placeholder.png";
		}
		
		// Return the full conversation data
		return {
			_id: conversationId,
			isGroup: args.isGroup,
			groupName: args.groupName,
			groupImage: groupImageUrl,
			admin: args.admin,
			participants: participantDetails,
			name: conversationName,
      		image: conversationImage,
			_creationTime: Date.now(),
		};
	},
});

export const getMyConversations = query(async ({ db, auth }) => {
	const identity = await auth.getUserIdentity();
	if (!identity) {
		console.error("Authentication required: identity is null");
	  	throw new Error("Authentication required");
	}

	// Fetch the user from the 'users' table
	const user = await db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

	if (!user) {
		throw new Error("User not found");
	}

	const userId = user._id;

	const userConversations = await db
    .query("user_conversations")
    .withIndex("by_user", (q) => q.eq("user", userId))
    .collect();

	// Extract conversation IDs
	const conversationIds = userConversations.map((uc) => uc.conversation);

		if (conversationIds.length === 0) {
			return [];
		}

		// Fetch conversations
		//const conversations = await db.getAll(...conversationIds);
		const conversations = await getAll(db, conversationIds);
		
		// Filter out any nulls (in case of deleted conversations)
		const validConversations = conversations.filter(
			(conversation) => conversation !== null
		) as any[];

		// Fetch conversations that have at least one message

		// code filtering conversations without messages.
		// const conversationsWithMessages = [];

		// for ( const conversation of validConversations ) {
		// 	const messageCounter = await db
		// 	  .query("messages")
		// 	  .withIndex("by_conversation", (q) => q.eq("conversation", conversation._id))
		// 	  //.collect();
		// 	  .take(1); // Check if at least one message exists
			
		// 	const messages = messageCounter.length;
		
		// 	if (messages > 0) {
		// 	  conversationsWithMessages.push(conversation);
		// 	}
		// }

		// Optionally, fetch participants for each conversation
		const conversationsWithDetails = await Promise.all(
			// Allow Conversations without messages 
			validConversations.map(async (conversation) => {
			//conversationsWithMessages.map(async (conversation) => {
				// Fetch participants
				const participantsEntries = await db
				.query("user_conversations")
				.withIndex("by_conversation", (q) =>
				  q.eq("conversation", conversation._id)
				)
				.collect();

			const participantIds = participantsEntries.map((entry) => entry.user);
			
			// Fetch participant details
			const participantDetails = await Promise.all(
				participantIds.map(async (id) => {
				  const participant = await db.get(id);
				  return participant;
				})
			);

			// Determine if any participant is online (excluding self)
			const otherParticipants = participantDetails.filter(
				//(p) => p._id !== userId
				(p) => p !== null && p._id !== userId
			);

			const isAnyParticipantOnline = otherParticipants.some(
				//(participant) => participant.isOnline
				(participant) => participant !== null && participant.isOnline
			);

			let conversationName = conversation.groupName;
			let conversationImage = conversation.groupImage;

			if (!conversation.isGroup) {
				// For one-to-one conversations, get the other participant's name and image
				const otherParticipant = otherParticipants[0];
				if (otherParticipant) {
					conversationName = otherParticipant.name;
					conversationImage = otherParticipant.image;
				}
			}

			// Fetch last message including 'seenBy' field
			const lastMessageArray = await db
			.query("messages")
			.withIndex("by_conversation", (q) =>
			  q.eq("conversation", conversation._id)
			)
			.order("desc") // Assuming newer messages have higher _creationTime
			.take(1);
	
		  	const lastMessage = lastMessageArray[0];

			  	const otherParticipantsLastRead = await Promise.all(
					otherParticipants.map(async (participant) => {
					if (participant) {
						const lastReadRecord = await db
						.query("user_conversation_reads")
						.withIndex("by_user_and_conversation", (q) =>
							q.eq("user", participant._id).eq("conversation", conversation._id)
						)
						.unique();
				
						return {
						userId: participant._id,
						lastReadTime: lastReadRecord ? lastReadRecord.lastReadTime : 0,
						};
					} else {
						// Handle the case where participant is null
						return {
						userId: null,
						lastReadTime: 0,
						};
					}
				})
			);

			// Determine if the last message has been seen by all other participants
			let isLastMessageSeen = false;
			if (lastMessage && lastMessage.sender === userId) {
			  isLastMessageSeen = otherParticipantsLastRead.every(
				(readInfo) => readInfo.lastReadTime >= lastMessage._creationTime
			  );
			}

			// Ensure that 'seenBy' is included in 'lastMessage'
			// const lastMessageWithSeenBy = lastMessage
			// ? {
			// 	...lastMessage,
			// 	seenBy: lastMessage.seenBy || [],
			//   }
			// : null;

			// Fetch last read time for the current user
			const lastReadRecord = await db
			.query("user_conversation_reads")
			.withIndex("by_user_and_conversation", (q) =>
			  q.eq("user", userId).eq("conversation", conversation._id)
			)
			.unique();
	
		  	const lastReadTime = lastReadRecord ? lastReadRecord.lastReadTime : 0;

			// Count unread messages - After: Excluding messages sent by the user
			// const unreadMessages = await db
			// .query("messages")
			// .withIndex("by_conversation", (q) => q.eq("conversation", conversation._id))
			// .filter((q) =>
			// 	q.and(
			// 	q.gt(q.field("_creationTime"), lastReadTime),
			// 	q.neq(q.field("sender"), userId)
			// 	)
			// )
			// .collect();

			// const unreadMessageCount = unreadMessages.length;
			// Count unread messages for the current user
			const unreadMessagesCounter = await db
			.query("messages")
			.withIndex("by_conversation", (q) =>
			  q.eq("conversation", conversation._id)
			)
			.filter((q) =>
			  q.and(
				q.gt(q.field("_creationTime"), lastReadTime),
				q.neq(q.field("sender"), userId)
			  )
			)
			.collect();
			const unreadMessageCount = unreadMessagesCounter.length;

			return {
				...conversation,
				participants: participantDetails,
				isAnyParticipantOnline,
				name: conversationName,
  				image: conversationImage,
				lastMessage: lastMessage || null,
        		unreadMessageCount,
        		isLastMessageSeen,
			};
		})
  	);
 	
  return conversationsWithDetails;
});

export const kickUser = mutation({
	args: {
		conversationId: v.id("conversations"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Unauthorized");

		const conversation = await ctx.db.get(args.conversationId);
		
		if (!conversation) throw new ConvexError("Conversation not found");

		// Check if the current user is the admin
		const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
		  q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.unique();

		if (!user || conversation.admin !== user._id) {
			throw new Error("Only the admin can kick users");
		}

		// Delete the user_conversation entry
		const userConversation = await ctx.db
		.query("user_conversations")
		.withIndex("by_user", (q) => q.eq("user", args.userId))
		.filter((q) => q.eq(q.field("conversation"), args.conversationId))
		.unique();

		if (userConversation) {
			await ctx.db.delete(userConversation._id);
		}
	},
});

export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

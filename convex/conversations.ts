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
	participants: any[]; // Replace `any[]` with the appropriate type
	_creationTime: number;
}
  
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

					
				  	return existingConversation;
				}
			}
		}

		let groupImage;

		if (args.isGroup && args.groupImage) {
			groupImage = (await ctx.storage.getUrl(args.groupImage)) as string;
		}

		// Insert the conversation
		const conversationId = await ctx.db.insert("conversations", {
			isGroup: args.isGroup,
			groupName: args.groupName,
			groupImage,
			admin: args.admin,
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
		const participantDetails = await Promise.all(
			participantIds.map((id) => ctx.db.get(id))
		);
		
		// Return the full conversation data
		return {
			_id: conversationId,
			isGroup: args.isGroup,
			groupName: args.groupName,
			groupImage,
			admin: args.admin,
			participants: participantDetails,
			_creationTime: Date.now(),
		};
	},
});

export const getMyConversations = query(async ({ db, auth }) => {
	const identity = await auth.getUserIdentity();
	if (!identity) {
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
    .withIndex("by_user", (q) => 
	q.eq("user", userId))
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

		// Optionally, fetch participants for each conversation
		const conversationsWithDetails = await Promise.all(
			validConversations.map(async (conversation) => {
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

			const lastMessage = await db
			.query("messages")
			.withIndex("by_conversation", (q) => q.eq("conversation", conversation._id))
			.order("desc") // Assuming newer messages have higher _creationTime
			.take(1);

			return {
				...conversation,
				participants: participantDetails,
				isAnyParticipantOnline,
				name: conversationName,
  				image: conversationImage,
				lastMessage: lastMessage[0] || null,
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

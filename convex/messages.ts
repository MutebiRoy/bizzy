// convex\messages.ts
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const sendTextMessage = mutation({
	args: {
		//sender: v.string(),
		sender: v.id("users"),
		content: v.string(),
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		let rawId = identity.tokenIdentifier;
		// If it has a pipe, split it
		if (rawId.includes("|")) {
			const parts = rawId.split("|");
			rawId = parts[parts.length - 1]; // take the last piece, e.g. "user_abc123"
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) => 
				q.eq("tokenIdentifier", rawId))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}
		
		//const conversation = await ctx.db.get(args.conversationId);
		const conversationId = args.conversationId;

		if (!conversationId) {
			throw new ConvexError("Conversation not found");
		}

		// Check if the user is a participant in the conversation
		const userConversation = await ctx.db
		.query("user_conversations")
		.withIndex("by_user", (q) => q.eq("user", user._id))
		.filter((q) => q.eq(q.field("conversation"), args.conversationId))
		.unique();

		if (!userConversation) {
			throw new ConvexError("You are not part of this conversation");
		}

		// if (!conversation.participants.includes(user._id)) {
		// 	throw new ConvexError("You are not part of this conversation");
		// }

		await ctx.db.insert("messages", {
			sender: user._id,
			content: args.content,
			conversation: conversationId,
			messageType: "text",
		});
		
	},
});

// Optimized
export const getMessages = query({
	args: {
		conversation: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) => q.eq("conversation", args.conversation))
			.order("asc")
			.collect();

			const messagesWithSender = await Promise.all(
				messages.map(async (message) => {
				  const sender = await ctx.db.get(message.sender);
				  if (!sender) {
					// Handle the rare case where sender is not found
					throw new Error(`Sender not found for message ${message._id}`);
				  }
				  return {
					...message,
					sender,
				  };
				})
			);

		return messagesWithSender;
	},
});

export const sendImage = mutation({
  args: {
    imgId: v.id("_storage"),
	conversationId: v.id("conversations"),
	sender: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

	let rawId = identity.tokenIdentifier;
	// If it has a pipe, split it
	if (rawId.includes("|")) {
		const parts = rawId.split("|");
		rawId = parts[parts.length - 1]; // take the last piece, e.g. "user_abc123"
	}

    // Fetch the authenticated user
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => 
		q.eq("tokenIdentifier", rawId))
    .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }
	const conversationId = args.conversationId;
    
	if (!conversationId) {
		throw new ConvexError("conversationId not found");
	}
		
	// Check if the user is a participant in the conversation
	const userConversation = await ctx.db
	.query("user_conversations")
	.withIndex("by_user", (q) => q.eq("user", user._id))
	.filter((q) => q.eq(q.field("conversation"), args.conversationId))
	.unique();

    if (!userConversation) {
		throw new ConvexError("You are not part of this conversation");
    }

	// Proceed with sending the image
    const imageUrl = (await ctx.storage.getUrl(args.imgId)) as string;

	if (!imageUrl) {
		throw new ConvexError("Failed to get image URL");
	}
    // Insert the image message
    await ctx.db.insert("messages", {
    	content: imageUrl,
	  	sender: args.sender,
      	messageType: "image",
      	conversation: conversationId,
    });
  },
});

export const sendVideo = mutation({
	args: {
	  videoId: v.id("_storage"),
	  conversationId: v.id("conversations"),
	  sender: v.id("users"),
	},
	handler: async (ctx, args) => {
	  const identity = await ctx.auth.getUserIdentity();
	  if (!identity) {
		throw new ConvexError("Unauthorized");
	  }

	  let rawId = identity.tokenIdentifier;
		// If it has a pipe, split it
		if (rawId.includes("|")) {
			const parts = rawId.split("|");
			rawId = parts[parts.length - 1]; // take the last piece, e.g. "user_abc123"
		}

  
	  // Fetch the authenticated user
	  const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) => 
			q.eq("tokenIdentifier", rawId))
		.unique();
  
		if (!user) {
			throw new ConvexError("User not found");
		}
  
	  	// Fetch the conversation
	  	const conversationId = args.conversationId;

		if (!conversationId) {
			throw new ConvexError("ConversationId not found");
	  	}

	  // Check if the user is a participant in the conversation
		const userConversation = await ctx.db
		.query("user_conversations")
		.withIndex("by_user", (q) => q.eq("user", user._id))
		.filter((q) => q.eq(q.field("conversation"), args.conversationId))
		.unique();
		
		if (!userConversation) {
			throw new ConvexError("You are not part of this conversation");
		}
	  // Verify that the user is a participant
	  	// Get the video URL
	  	const videoUrl = (await ctx.storage.getUrl(args.videoId)) as string;
		
		if (!videoUrl) {
			throw new ConvexError("Failed to get video URL");
		}
		// Insert the video message
		await ctx.db.insert("messages", {
			content: videoUrl,
			sender: user._id,
			messageType: "video",
			conversation: conversationId,
		});
	},
});

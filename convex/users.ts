//C:\Users\mutebi\Desktop\bizmous\convex\users.ts
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

interface CustomUser {
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
}

export const getUserById = query({
	args: {
	  userId: v.id("users"),
	},
	handler: async (ctx, { userId }) => {
	  const user = await ctx.db.get(userId);
	  if (!user) throw new Error("User not found");
	  return user;
	},
});

// Change Profile image
export const generateUploadUrl = mutation(async ({ storage, auth }) => {
	const identity = await auth.getUserIdentity();
	if (!identity) {
	  throw new Error("Unauthorized");
	}
	// Return the upload URL as a string
	return await storage.generateUploadUrl();
});

	
export const createUser = internalMutation({
	args: {
		tokenIdentifier: v.string(),
		email: v.string(),
		name: v.string(),
		image: v.string(),
	},
	handler: async (ctx, args) => {
		// Generate a default username from email
		const emailPrefix = args.email.split("@")[0];
		let baseUsername = emailPrefix.slice(0, 20);
		let username = baseUsername;
		let suffix = 1;

		// Function to generate a new username with suffix
		const generateUsernameWithSuffix = () => {
			const suffixStr = suffix.toString();
			const maxBaseLength = 20 - suffixStr.length;
			const appNameToUsername = "user";
			return appNameToUsername + baseUsername.slice(0, maxBaseLength) + suffixStr;
		};

		// Ensure the username is unique
		while (true) {
			const existingUser = await ctx.db
			  .query("users")
			  .withIndex("by_username", (q) => q.eq("username", username))
			  .first();
			
			if (!existingUser) break;

			suffix++;
			username = generateUsernameWithSuffix();

			if (suffix > 99999) {
				throw new Error("Unable to generate a unique username");
			}
		  }

		await ctx.db.insert("users", {
			tokenIdentifier: args.tokenIdentifier,
			email: args.email,
			name: args.name || baseUsername,
			image: args.image,
			isOnline: true,
			username,

		});
	},
});

// check if a username is available
export const checkUsernameAvailability = query({
	args: { username: v.string() },
	handler: async (ctx, { username }) => {
	  const normalizedUsername = normalizeUsername(username);
	  const existingUser = await ctx.db
		.query("users")
		.withIndex("by_username", (q) =>
		  q.eq("username", normalizedUsername)
		)
		.first();
	  return !existingUser;
	},
});

// Helper function to normalize usernames
function normalizeUsername(username: string): string {
	return username.trim().toLowerCase();
}

// Update the whole profile
export const updateProfile = mutation({
	args: {
	  name: v.string(),
	  username: v.string(),
	  instagramHandle: v.optional(v.string()),
	  tiktokHandle: v.optional(v.string()),
	  imageStorageId: v.optional(v.string()),
	},
	handler: async (
	  { db, auth },
	  { name, username, instagramHandle, tiktokHandle, imageStorageId }
	) => {
	  const identity = await auth.getUserIdentity();
	  if (!identity) throw new Error("Unauthorized");
  
	  const user: CustomUser | null = await db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
		  q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.unique();
  
	  if (!user) throw new Error("User not found");
  
	  // Trim and validate name
	  const trimmedName = name.trim();
	  if (trimmedName.length < 2 || trimmedName.length > 20) {
		throw new Error("Name must be between 2 and 20 characters.");
	  }
  
	  const normalizedUsername = username.trim().toLowerCase();
  
	  // Check if the username is taken by another user (case-insensitive)
	  const existingUser = await db
		.query("users")
		.withIndex("by_username", (q) => q.eq("username", normalizedUsername))
		.first();
  
	  if (existingUser && existingUser._id.toString() !== user._id.toString()) {
		throw new Error("Username is already taken.");
	  }
  
	  // Enforce maximum lengths for handles
	  if (instagramHandle && instagramHandle.length > 25) {
		throw new Error("Instagram handle must be 25 characters or less.");
	  }
  
	  if (tiktokHandle && tiktokHandle.length > 25) {
		throw new Error("TikTok handle must be 25 characters or less.");
	  }
  
	  // Prepare the fields to update
	  const updateFields: Partial<CustomUser> = {
		name: trimmedName,
		username: normalizedUsername,
		instagramHandle: instagramHandle?.trim() || undefined,
		tiktokHandle: tiktokHandle?.trim() || undefined,
	  };
  
	  if (imageStorageId) {
		updateFields.imageStorageId = imageStorageId as Id<"_storage">;
	  }
  
	  await db.patch(user._id, updateFields);
	},
});
  

// Update user profile image
export const updateUser = internalMutation({
	args: { 
		tokenIdentifier: v.string(), 
		image: v.string() 
	},
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		await ctx.db.patch(user._id, {
			image: args.image,
		});
	},
});

export const setUserOnline = internalMutation({
	args: { tokenIdentifier: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		await ctx.db.patch(user._id, { isOnline: true });
	},
});

export const setUserOffline = internalMutation({
	args: { tokenIdentifier: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
			.unique();

		if (!user) {
			throw new ConvexError("User not found");
		}

		await ctx.db.patch(user._id, { isOnline: false });
	},
});

export const getUsers = query({
	args: {},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Unauthorized");
		}

		const users = await ctx.db.query("users").collect();
		// const users = await ctx.db.query("users").take(100);
		return users.filter((user) => user.tokenIdentifier !== identity.tokenIdentifier);
	},
});


export const getMe = query(async ({ db, auth, storage }) => {
	const identity = await auth.getUserIdentity();
	if (!identity) throw new Error("Unauthorized");
  
	const user: CustomUser | null = await db
	  .query("users")
	  .withIndex("by_tokenIdentifier", (q) =>
		q.eq("tokenIdentifier", identity.tokenIdentifier)
	  )
	  .unique();
  
	if (!user) throw new Error("User not found");
  
	let imageUrl = user.image || "/placeholder.png";
  
	if (user.imageStorageId) {
	  const url = await storage.getUrl(user.imageStorageId);
	  if (url) {
		imageUrl = url;
	  }
	}
  
	return {
	  ...user,
	  image: imageUrl,
	};
});
  

export const getGroupMembers = query({
	args: { 
		conversationId: v.id("conversations") 
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Unauthorized");
		}

		const conversation = await ctx.db
			.query("conversations")
			.filter((q) => q.eq(q.field("_id"), args.conversationId))
			.first();
		if (!conversation) {
			throw new ConvexError("Conversation not found");
		}

		// Fetch participants from user_conversations
		const participantsEntries = await ctx.db
		.query("user_conversations")
		.withIndex("by_conversation", (q) => q.eq("conversation", args.conversationId))
		.collect();

		const participantIds = participantsEntries.map((entry) => entry.user);
		// Fetch participant details
		const participants = await Promise.all(
			participantIds.map(async (id) => {
			  const user = await ctx.db.get(id);
			  return user;
			})
		);
		
		//const groupMembers = users.filter((user) => conversation.participants.includes(user._id));
		return participants;
		//return groupMembers;
	},
});

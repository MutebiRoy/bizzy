// convex\users.ts
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const STANDARD_GENDERS = ["male", "female", "prefer not to say"];

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
	youtubeHandle?: string;
	tags?: string[];
	gender?: string;
	preferredGender?: string;
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

export const getUserByUsername = query({
	args: {
	  username: v.string(),
	},
	handler: async (ctx, { username }) => {
	  const normalizedUsername = username.trim().toLowerCase();
	  const user = await ctx.db
		.query("users")
		.withIndex("by_username", q => q.eq("username", normalizedUsername))
		.first();
  
	  if (!user) return null;
  
	  let imageUrl = user.image || "/placeholder.png";
	  if (user.imageStorageId) {
		const url = await ctx.storage.getUrl(user.imageStorageId);
		if (url) imageUrl = url;
	  }
  
	  return {
		...user,
		image: imageUrl,
	  };
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

		// Default gender
		let baseGender = 'prefer not to say';
		let gender = baseGender;
		
		// Default preferred gender
		let basePreferredGender = 'all genders';
		let preferredGender = basePreferredGender;

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
			gender,
			preferredGender,
		});
	},
});

export const getOnlineUsers = query(async ({ db, storage }) => {
	const users = await db.query("users").collect();
	const onlineUsers = users.filter((u) => u.isOnline);
  
	const usersWithImages = await Promise.all(
	  onlineUsers.map(async (user) => {
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
	  })
	);
  
	return usersWithImages;
});

export const getAllGenders = query(async ({ db }) => {
	const genderDocs = await db.query("genders").collect();
	// genderDocs: [{_id, genderName}, ...]
  
	// Extract genderName strings
	const genderNames = genderDocs.map(d => d.genderName);
  
	// Make sure we have unique set
	const uniqueGenders = Array.from(new Set(genderNames));
  
	return uniqueGenders;
});

// Helper function to normalize usernames
function normalizeUsername(username: string): string {
	return username.trim().toLowerCase();
}

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

// A helper to ensure a gender exists in genders table if it's custom
async function ensureGenderExists(db: any, gender: string): Promise<string> {
	const g = gender.trim().toLowerCase();
	// If standard or "all genders", just return
	if (STANDARD_GENDERS.includes(g) || g === "all genders") {
	  return Promise.resolve(g);
	}
  
	// Check if custom gender exists
	return db.query("genders")
	.withIndex("by_genderName", (q: any) => q.eq("genderName", g))
	  .unique()
	  .then((existing: any) => {
		if (!existing) {
		  return db.insert("genders", { genderName: g }).then(() => g);
		}
		return g;
	  });
  }

// Update the whole profile
export const updateProfile = mutation({
	args: {
	  name: v.string(),
	  username: v.string(),
	  instagramHandle: v.optional(v.string()),
	  tiktokHandle: v.optional(v.string()),
	  youtubeHandle: v.optional(v.string()),
	  imageStorageId: v.optional(v.string()),
	  tags: v.optional(v.array(v.string())),
	  gender: v.optional(v.string()),
	  preferredGender: v.optional(v.string()),
	},
	handler: async (
	  ctx,
	  {
		name,
		username,
		instagramHandle,
		tiktokHandle,
		youtubeHandle,
		imageStorageId,
		tags,
		gender,
		preferredGender,
	  }
	) => {
	  const { db, auth } = ctx;
	  const identity = await auth.getUserIdentity();
	  if (!identity) throw new Error("Unauthorized");
  
	  const user = await db
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

	  if (normalizedUsername.length < 2 || normalizedUsername.length > 25 ) {
		throw new Error("Username must be 2 to 25 characters");
	  }
  
	  // Check if the username is already taken by another user (case-insensitive)
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
  
	  if (youtubeHandle && youtubeHandle.length > 30) {
		throw new Error("YouTube handle must be 30 characters or less.");
	  }
	  // For gender, if not provided or empty, default to "Prefer not to say"
	  let finalGender = (gender?.trim().toLowerCase()) || "prefer not to say";
	  let finalPreferredGender = (preferredGender?.trim().toLowerCase()) || "all genders";
      
	  // Handle the special case where both gender and preferredGender are the same default value
	//   if (finalGender === "prefer not to say" && finalPreferredGender === "prefer not to say") {
	// 	throw new Error("You cannot update both gender and preferred gender to the same default value.");
	//   }

	  if (finalGender.length > 25) {
		throw new Error("Gender must be 25 characters or less.");
	  }

	  if (finalPreferredGender.length > 25) {
	    throw new Error("Preferred gender must be 25 characters or less.");
	  }

	  // Ensure custom genders exist in genders table
	  try {
		finalGender = await ensureGenderExists(db, finalGender);
		finalPreferredGender = await ensureGenderExists(db, finalPreferredGender);
	  } catch (error) {
		console.error("Error ensuring gender exists:", error);
		throw new Error("Failed to process gender information.");
	  }

	  // Prepare the fields to update
	  const updateFields: Partial<typeof user> = {
		name: trimmedName,
		username: normalizedUsername,
		instagramHandle: instagramHandle?.trim() || undefined,
		tiktokHandle: tiktokHandle?.trim() || undefined,
		youtubeHandle: youtubeHandle?.trim() || undefined,
		gender: finalGender,
		preferredGender: finalPreferredGender,
	  };
  
	  if (imageStorageId) {
		updateFields.imageStorageId = imageStorageId as Id<"_storage">;
	  }
  
	  // Normalize tags to lowercase
	  const newTags = tags ? tags.map((tag) => tag.toLowerCase()) : [];
  
	  // Fetch existing tags for comparison
	  const oldTags = user.tags || [];
  
	  // Update the user document with new tags
	  updateFields.tags = newTags;
  
	  // Apply updates to the user document
	  await db.patch(user._id, updateFields);
  
	  // Calculate added and removed tags
	  const addedTags = newTags.filter((tag) => !oldTags.includes(tag));
	  const removedTags = oldTags.filter((tag) => !newTags.includes(tag));
  
	  // Handle added tags
	  for (const tag of addedTags) {
		// Check if the tag document exists
		let tagDoc = await db
		  .query("tags")
		  .withIndex("by_tagName", (q) => q.eq("tagName", tag))
		  .unique();
  
		if (tagDoc) {
		  // Add user ID to the existing tag document
		  await db.patch(tagDoc._id, {
			userIds: [...tagDoc.userIds, user._id],
		  });
		} else {
		  // Create a new tag document
		  await db.insert("tags", {
			tagName: tag,
			userIds: [user._id],
		  });
		}
	  }
  
	  // Handle removed tags
	  for (const tag of removedTags) {
		let tagDoc = await db
		  .query("tags")
		  .withIndex("by_tagName", (q) => q.eq("tagName", tag))
		  .unique();
  
		if (tagDoc) {
		  // Remove user ID from the tag document
		  const updatedUserIds = tagDoc.userIds.filter(
			(id) => id !== user._id
		  );
  
		  if (updatedUserIds.length === 0) {
			// Remove the tag document if no users are left
			await db.delete(tagDoc._id);
		  } else {
			await db.patch(tagDoc._id, {
			  userIds: updatedUserIds,
			});
		  }
		}
	  }
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
	  const filteredUsers = users.filter((user) => user.tokenIdentifier !== identity.tokenIdentifier);
  
	  // Fetch updated image URLs for each user
	  const usersWithImages = await Promise.all(
		filteredUsers.map(async (user) => {
		  let imageUrl = user.image || "/placeholder.png";
  
		  if (user.imageStorageId) {
			const url = await ctx.storage.getUrl(user.imageStorageId);
			if (url) {
			  imageUrl = url;
			}
		  }
  
		  return {
			...user,
			image: imageUrl,
		  };
		})
	  );
  
	  return usersWithImages;
	},
});
  


export const getMe = query(async ({ db, auth, storage }) => {
	const identity = await auth.getUserIdentity();
	if (!identity) throw new Error("Unauthorized");
	let rawId = identity.tokenIdentifier;
	// If it has a pipe, split it
	if (rawId.includes("|")) {
	  const parts = rawId.split("|");
	  rawId = parts[parts.length - 1]; // take the last piece, e.g. "user_abc123"
	}
	const user = await db
	.query("users")
	.withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", rawId))
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
  
	  const conversation = await ctx.db.get(args.conversationId);
	  if (!conversation) {
		throw new ConvexError("Conversation not found");
	  }
  
	  // Fetch participants from user_conversations
	  const participantsEntries = await ctx.db
		.query("user_conversations")
		.withIndex("by_conversation", (q) => q.eq("conversation", args.conversationId))
		.collect();
  
	  const participantIds = participantsEntries.map((entry) => entry.user);
  
	  // Fetch participant details with updated image URLs
	  const participants = await Promise.all(
		participantIds.map(async (id) => {
		  const user = await ctx.db.get(id);
		  if (user) {
			let imageUrl = user.image || "/placeholder.png";
  
			if (user.imageStorageId) {
			  const url = await ctx.storage.getUrl(user.imageStorageId);
			  if (url) {
				imageUrl = url;
			  }
			}
  
			return {
			  ...user,
			  image: imageUrl,
			};
		  }
		  return null;
		})
	  );
  
	  // Filter out any nulls
	  return participants.filter((user) => user !== null);
	},
});
  

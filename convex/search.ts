// convex\search.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { filter } from "convex-helpers/server/filter";

export const searchUsersByTerm = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) return [];

    // Perform search on 'name' field
    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => 
        q.search("name", trimmedSearchTerm)
      )
      .collect();

    // Perform search on 'username' field
    const usernameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_username", (q) =>
        q.search("username", trimmedSearchTerm)
      )
      .collect();
    
    // Fetch users whose tags are not empty
    // const usersWithTags = await ctx.db
    // .query("users")
    // .filter((q) => q.neq(q.field("tags"), []))
    // .collect();

    // // Change below
    // // Filter users whose tags contain the search term
    // const tagResults = usersWithTags.filter((user) =>
    // user.tags?.some((tag) => tag.toLowerCase().includes(trimmedSearchTerm))
    // );

    // Merge the results, avoiding duplicates
    const allUsersMap = new Map();
    for (const user of [...nameResults, ...usernameResults]) {
      allUsersMap.set(user._id.toString(), user);
    }
    const allResults = Array.from(allUsersMap.values());

    // change the above

    // Fetch updated image URLs for each user
    const usersWithImages = await Promise.all(
      allResults.map(async (user) => {
        let imageUrl = user.image || "/placeholder.png";

        if (user.imageStorageId) {
          const storageId = user.imageStorageId as Id<"_storage">;
          const url = await ctx.storage.getUrl(storageId);
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

export const searchUsersByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, { tag }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return [];

    // Fetch the tag document
    const tagDoc = await ctx.db
      .query("tags")
      .withIndex("by_tagName", (q) => q.eq("tagName", trimmedTag))
      .unique();

    if (!tagDoc) {
      // No users have this tag
      return [];
    }

    // Fetch the user documents
    const users = await Promise.all(
      tagDoc.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) {
          // User document not found, skip or handle accordingly
          return null;
        }
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
    return users;
  },
});

export const searchTagsByTerm = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (!trimmedSearchTerm) return [];

    // Fetch tags matching the search term
    const matchingTags = await filter(
      ctx.db.query("tags"),
      (tagDoc) => tagDoc.tagName.startsWith(trimmedSearchTerm)
    ).collect();

    // Extract tag names
    const tagNames = matchingTags.map((tagDoc) => tagDoc.tagName);

    return tagNames;
  },
});


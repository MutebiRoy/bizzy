// convex\search.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchUsersByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    if (!searchTerm.trim()) return [];

    // Use the search index defined on the 'name' field in your 'users' table
    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", searchTerm))
      .collect();

    // Fetch updated image URLs for each user
    const usersWithImages = await Promise.all(
      users.map(async (user) => {
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

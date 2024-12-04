// convex\search.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const searchUsersByNameUsername = query({
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
      .withSearchIndex("search_name", (q) => q.search("name", trimmedSearchTerm))
      .collect();

    // Perform search on 'username' field
    const usernameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_username", (q) =>
        q.search("username", trimmedSearchTerm)
      )
      .collect();

    // Merge the results, avoiding duplicates
    const allUsersMap = new Map();
    for (const user of [...nameResults, ...usernameResults]) {
      allUsersMap.set(user._id.toString(), user);
    }
    const allResults = Array.from(allUsersMap.values());

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

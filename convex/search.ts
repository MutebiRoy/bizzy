import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchUsersByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    if (!searchTerm.trim()) return [];

    // Use the search index defined on the 'name' field in your 'users' table
    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", searchTerm))
      .collect();

    return users;
  },
});

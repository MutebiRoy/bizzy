import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    image: v.string(),
    tokenIdentifier: v.string(),
    isOnline: v.boolean(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    // Add this line to define a search index on the 'name' field
    .searchIndex("search_name", { searchField: "name" }),

  conversations: defineTable({
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    admin: v.optional(v.id("users")),
  }),

  user_conversations: defineTable({
    user: v.id("users"),
    conversation: v.id("conversations"),
  })
    .index("by_user", ["user"])
    .index("by_conversation", ["conversation"]),

  messages: defineTable({
    content: v.string(),
    conversation: v.id("conversations"),
    sender: v.id("users"), // Defines 'sender' as an ID referencing 'users' table
    messageType: v.union(
      v.literal("text"), 
      v.literal("image"), 
      v.literal("video")
    ),
  }).index("by_conversation", ["conversation"]),
});

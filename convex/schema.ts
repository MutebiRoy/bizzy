// C:\Users\mutebi\Desktop\bizmous\convex\schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    tokenIdentifier: v.string(),
    isOnline: v.boolean(),
    username: v.optional(v.string()),
    instagramHandle: v.optional(v.string()),
    tiktokHandle: v.optional(v.string()),
    youtubeHandle: v.optional(v.string()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .searchIndex("search_name", { searchField: "name" }),

  conversations: defineTable({
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    admin: v.optional(v.id("users")),
    initiator: v.id("users"),
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
  })
  .index("by_conversation", ["conversation"])
  .index("by_sender", ["sender"]),

  user_conversation_reads: defineTable({
    user: v.id("users"),
    conversation: v.id("conversations"),
    lastReadTime: v.number(), // Store timestamp in milliseconds
  })
    .index("by_user_and_conversation", ["user", "conversation"]),
});

import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const getConversationById = query({
  args: { conversationId: v.id("conversations") },
  handler: async ({ db }, { conversationId }) => {
    const conversation = await db.get(conversationId);

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Fetch participants
    const participantsEntries = await db
      .query("user_conversations")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation", conversationId)
      )
      .collect();

    const participantIds = participantsEntries.map((entry) => entry.user);

    // Fetch participant details
    const participantDetails = await Promise.all(
      participantIds.map((id) => db.get(id))
    );

    return {
      ...conversation,
      participants: participantDetails,
    };
  },
});

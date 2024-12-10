// convex\users.ts
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";


export const getAllGenders = query(async ({ db }) => {
	const genderDocs = await db.query("genders").collect();
	// genderDocs: [{_id, genderName}, ...]
  
	// Extract genderName strings
	const genderNames = genderDocs.map(d => d.genderName);
  
	// Make sure we have unique set
	const uniqueGenders = Array.from(new Set(genderNames));
  
	return uniqueGenders;
});
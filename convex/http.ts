// convex\http.ts
"use node";
import { httpRouter } from "convex/server";
import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import nodemailer from "nodemailer";
import { v } from "convex/values";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// Create a Nodemailer transporter (example: Gmail SMTP, port 587)
const transporter = nodemailer.createTransport({
	//host: "smtp.gmail.com",
	service: "gmail",
	//port: 587,
	//secure: false, // true if port 465
	auth: {
	  user: smtpUser,
	  pass: smtpPass,
	},
});

export const sendNewUserEmail = internalAction({
	args: {
	  name: v.string(),
	  email: v.string(),
	  clerkId: v.string(),
	},
	handler: async (ctx, { name, email, clerkId }) => {
	  // Use nodemailer to send an email to al@almutebi.com
	  try {
		await transporter.sendMail({
		  from: '"Bizmous Notifications" <no-reply@bizmous.com>',
		  to: "al@almutebi.com",
		  subject: "New User Signed Up on Bizmous",
		  text: `A new user just signed up!\n\nName: ${name}\nEmail: ${email}\nClerk ID: ${clerkId}\n`,
		});
		//console.log("Email sent successfully to al@almutebi.com");
	  } catch (err) {
		//console.error("Failed to send email:", err);
	  }
	},
});

const http = httpRouter();

http.route({
	path: "/clerk",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		const payloadString = await req.text();
		const headerPayload = req.headers;

		try {
			const result = await ctx.runAction(internal.clerk.fulfill, {
				payload: payloadString,
				headers: {
					"svix-id": headerPayload.get("svix-id")!,
					"svix-signature": headerPayload.get("svix-signature")!,
					"svix-timestamp": headerPayload.get("svix-timestamp")!,
				},
			});

			switch (result.type) {
				case "user.created":

					const email = result.data.email_addresses[0]?.email_address;
					let defaultName = email.split('@')[0];

					const obfuscateName = (name: string) => {
						const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
						const randomChar = () => characters.charAt(Math.floor(Math.random() * characters.length));
						let obfuscatedName = '';
						for (let i = 0; i < name.length; i++) {
							obfuscatedName += name[i];
							if (Math.random() > 0.5) {
								obfuscatedName += randomChar();
							}
						}
						return obfuscatedName;
					};

					defaultName = obfuscateName(defaultName);

					let name = "";
					if (result.data.first_name && result.data.last_name) {
						name = `${result.data.first_name} ${result.data.last_name}`;
					} else if (result.data.first_name) {
						name = result.data.first_name;
					} else if (result.data.last_name) {
						name = result.data.last_name;
					} else {
						name = defaultName;
					}

					// User Signup Email notification to admin
					//const tokenIdentifier = `${process.env.CLERK_APP_DOMAIN}|${result.data.id}`;
					const tokenIdentifier = result.data.id;
					
					const userCreateResult = await ctx.runMutation(internal.users.createUser, {
						tokenIdentifier,
						email: email,
						name: name,
						image: result.data.image_url,
					});

					if (userCreateResult.status === "CREATED") {
						// This is the user's very first time
						// 1. Send an internal email if needed
						await ctx.runAction(internal.http.sendNewUserEmail, {
							name,
							email: email,
							clerkId: result.data.id,
						});
					}
					
					break;
				case "user.updated":
					await ctx.runMutation(internal.users.updateUser, {
						//tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.id}`,
						tokenIdentifier: result.data.id,
						image: result.data.image_url,
					});
					break;
				case "session.created":
					await ctx.runMutation(internal.users.setUserOnline, {
						//tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.user_id}`,
						tokenIdentifier: result.data.id,
					});
					break;
				case "session.ended":
					await ctx.runMutation(internal.users.setUserOffline, {
						//tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.user_id}`,
						tokenIdentifier: result.data.id,
					});
					break;
			}

			return new Response(null, {
				status: 200,
			});
		} catch (error) {
			console.log("Webhook Error🔥🔥", error);
			return new Response("Webhook Error", {
				status: 400,
			});
		}
	}),
});

export default http;

// https://docs.convex.dev/functions/http-actions
// Internal functions can only be called by other functions and cannot be called directly from a Convex client.

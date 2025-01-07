
// convex\http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

					await ctx.runMutation(internal.users.createUser, {
						tokenIdentifier: result.data.id,
						email: email,
						name: name,
						image: result.data.image_url,
					});
					break;
				case "user.updated":
					await ctx.runMutation(internal.users.updateUser, {
						tokenIdentifier: result.data.id,
						image: result.data.image_url,
					});
					break;
				case "session.created":
					await ctx.runMutation(internal.users.setUserOnline, {
						tokenIdentifier: result.data.id,
					});
					break;
				case "session.ended":
					await ctx.runMutation(internal.users.setUserOffline, {
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

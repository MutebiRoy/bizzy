// convex\auth.config.ts
const authConfig = {
	providers: [
	  {
		//domain: process.env.CLERK_ISSUER_URL,
		domain: "https://bizmous.com",
		applicationID: "convex",
	  },
	]
  };

export default authConfig;


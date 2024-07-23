const authConfig = {
	providers: [
	  {
		//domain: process.env.CLERK_ISSUER_URL,
		domain: "https://hopeful-whale-77.clerk.accounts.dev",
		applicationID: "convex",
	  },
	]
  };

export default authConfig;

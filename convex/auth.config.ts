// convex\auth.config.ts
const authConfig = {
	providers: [
	  {
		// domain: process.env.CLERK_ISSUER_URL,
		domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
		applicationID: "convex",
		userIdClaim: "token_identifier",
	  },
	]
  };

export default authConfig;


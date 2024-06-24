import {
	clerkMiddleware,
	createRouteMatcher
  } from '@clerk/nextjs/server';
  
  const isProtectedRoute = createRouteMatcher([
	'/(.*)'
  ]);
  
export default clerkMiddleware((auth, req) => {
    if (!auth.userId && isProtectedRoute(req)) {
        // Check for existing sign-in attempts
        if (auth.isAuthenticating()) {
            return Response.redirect(req.url, 307); // Retry current URL
        } else {
            return auth.redirectToSignIn(); 
        }
    }
});
  
  export const config = {
	matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
  };

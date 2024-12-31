// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
	// Protect all routes EXCEPT sign-in, sign-up, static files, _next, etc.
	"/((?!_next|sign-in|sign-up|.*\\..*).*)",
]);

export default clerkMiddleware((auth, req) => {
	if (!auth().userId && isProtectedRoute(req)) {
	  // If user is not signed in and route is protected, redirect to sign-in:
	  const signInUrl = new URL("/sign-in", req.url);
	  return NextResponse.redirect(signInUrl);
	}
});

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};

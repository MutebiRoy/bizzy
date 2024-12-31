// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!auth().userId && isProtectedRoute(req)) {
    // Build the sign-in URL pointing to your local page
    const signInUrl = new URL("/sign-in", req.url);
    // Optional: If you want to preserve the original path, use query params
    // signInUrl.searchParams.set("redirect_url", req.url);

    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

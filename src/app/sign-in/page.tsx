// app/sign-in/page.tsx (Next.js App Router example)
"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}

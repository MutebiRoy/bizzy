// app/sign-up/page.tsx
"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in" 
      />
    </main>
  );
}

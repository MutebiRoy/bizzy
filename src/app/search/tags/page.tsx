// src/app/search/tags/page.tsx

"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversationStore } from "@/store/chat-store";
import { ConversationType, UserType, convertConversationTypes } from "@/utils/conversation_utils";
import { Home } from "lucide-react";

const TagsSearchPage = () => {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get("term") || "";
  const router = useRouter();

  const { isAuthenticated } = useConvexAuth();

  const tagResults = useQuery(
    api.search.searchTagsByTerm,
    isAuthenticated && searchTerm ? { searchTerm } : "skip"
  );

  const handleTagClick = (tag: string) => {
    router.push(`/tags/${encodeURIComponent(tag)}`);
  };

  return (
  <div className="flex flex-col min-h-screen">
    <div className="flex flex-col p-4 flex-grow">
      <h1 className="text-xl font-bold mb-4">
        Tags matching &quot;{searchTerm}&quot;
      </h1>
      {tagResults?.map((tag: string, index: number) => (
        <div
          key={index}
          className="p-2 hover:bg-accent cursor-pointer"
          onClick={() => handleTagClick(tag)}
        >
          #{tag}
        </div>
      ))}
    </div>

    <footer className="p-4 flex justify-center items-center">
      <button
        onClick={() => router.push("/")}
        aria-label="Home"
      >
        <Home className="w-6 h-6" />
      </button>
    </footer>
  </div>
  );
};

export default function Page() {
	return (
	  <Suspense fallback={<div>Loading...</div>}>
		  <TagsSearchPage />
	  </Suspense>
	);
}

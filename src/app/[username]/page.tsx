// app/[username]/page.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import {api} from "../../../convex/_generated/api"
import { useConvexAuth } from "convex/react";
import Image from "next/image";
import { Home, Link } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UserProfilePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract username from pathname (e.g. "/mutebi" -> "mutebi")
  const username = pathname.replace("/", "");

  const user = useQuery(api.users.getUserByUsername, username ? { username } : "skip");

  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // If user is not authenticated, you could redirect to login or just show a message
      // For now, let's just show a toast and maybe redirect:
      toast.error("You must be logged in to view profiles.");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (!isAuthenticated) {
    return null; // or a message that user must log in
  }

  // If still loading user or username empty
  if (!username) {
    return <p className="text-center mt-4">Loading user...</p>;
  }

  if (user === undefined) {
    // Query still loading
    return <p className="text-center mt-4">Loading user...</p>;
  }

  if (user === null) {
    // No such user
    return <p className="text-center mt-4">User not found.</p>;
  }

  const profileUrl = `https://bizmous.com/${user.username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
<div className="flex flex-col min-h-screen">
      {/* Main content area with flex-grow to push the footer down */}
    <div className="flex flex-col items-center p-4 space-y-4 flex-grow">
        <div className="flex flex-col items-center space-y-4 mt-10">
            <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image
                    src={user.image || "/placeholder.png"}
                    alt={user.name || "User Profile Picture"}
                    fill
                    className="object-cover"
                />
            </div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="flex flex-col items-center space-y-2">
            {user.username && (
                <div className="flex items-center space-x-2">
                <p className="">@{user.username}</p>
                <button
                    onClick={handleCopyLink}
                    className="text-sm"
                >
                    <Link className="" />
                </button>
                </div>
            )}

            {user.instagramHandle && (
                <p className="text-sm">
                Instagram:{" "}
                <a
                    href={`https://instagram.com/${user.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                >
                    @{user.instagramHandle}
                </a>
                </p>
            )}

            {user.tiktokHandle && (
                <p className="text-sm">
                TikTok:{" "}
                <a
                    href={`https://tiktok.com/@${user.tiktokHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                >
                    @{user.tiktokHandle}
                </a>
                </p>
            )}

            {user.youtubeHandle && (
                <p className="text-sm">
                YouTube:{" "}
                <a
                    href={`https://youtube.com/@${user.youtubeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                >
                    @{user.youtubeHandle}
                </a>
                </p>
            )}
            </div>
        </div>
    </div>

    {/* Footer with Home icon */}
    <footer className="p-4 flex justify-center ">
        <button
            onClick={() => router.push("/")}
            className=""
            aria-label="Home"
        >
            <Home className="w-6 h-6" />
        </button>
    </footer>
</div>
  );
}

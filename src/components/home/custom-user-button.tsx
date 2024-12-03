// src/components/home/custom-user-button.tsx
"use client";
import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react"; // Use UserEdit instead of UserPen
import { useRouter } from "next/navigation";
import EditProfileDialog from "./edit-profile-dialog";
import { useAuth } from "@clerk/nextjs";

const CustomUserButton = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const me = useQuery(api.users.getMe);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (!me) {
    return null; // or a loading indicator
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer">
            <Avatar className="w-8 h-8">
              <AvatarImage src={me.image || "/placeholder.png"} />
              <AvatarFallback>{me.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              signOut();
              router.push("/"); // Redirect to home or login page after sign out
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Place the EditProfileDialog outside the DropdownMenu */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
    </>
  );
};

export default CustomUserButton;

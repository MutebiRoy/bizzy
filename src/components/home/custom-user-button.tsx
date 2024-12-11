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
import { LogOut, Pencil, Users, Plus, Share } from "lucide-react"; // Use UserEdit instead of UserPen
import { useRouter } from "next/navigation";
import EditProfileDialog from "./edit-profile-dialog";
import { useAuth } from "@clerk/nextjs";
import UserListDialog from "./user-list-dialog";
import ThemeSwitch from "./theme-switch";

const CustomUserButton = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const me = useQuery(api.users.getMe);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const isAuthenticated = !!me;

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
        <DropdownMenuContent className="ml-3">
          {/* People Online */}
          <DropdownMenuItem onClick={() => {
            router.push("/online");
          }}>
            <Users className="mr-2 h-4 w-4" />
            <span>People Online</span>
          </DropdownMenuItem>

          {/* Create Groups */}
          {isAuthenticated && (
            <DropdownMenuItem onClick={() => setIsUserListOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Groups</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>

          {/* view My Profile */}
          <DropdownMenuItem onClick={() => {
            router.push(`/${me.username}`)
          }}>
            <Share className="mr-2 h-4 w-4" />
            <span>View my profile</span>
          </DropdownMenuItem>

          {/* Theme Switch */}

          <ThemeSwitch />
          

          <DropdownMenuItem
            onClick={() => {
              signOut();
              router.push("/"); // Redirect to login page
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals outside the DropdownMenu */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
      <UserListDialog 
        open={isUserListOpen}
        onOpenChange={setIsUserListOpen}
      />
    </>
  );
};

export default CustomUserButton;

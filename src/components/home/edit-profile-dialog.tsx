// src/components/home/edit-profile-dialog.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";

const EditProfileDialog = () => {
  const { isAuthenticated } = useConvexAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const me = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  // Fetch username availability
  const isUsernameAvailable = useQuery(
    api.users.checkUsernameAvailability,
    username && username.toLowerCase() !== me?.username?.toLowerCase()
      ? { username }
      : "skip"
  );

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setUsername(me.username || "");
      setInstagramHandle(me.instagramHandle || "");
      setTiktokHandle(me.tiktokHandle || "");
    }
  }, [me]);

  useEffect(() => {
    if (isUsernameAvailable !== undefined) {
      setUsernameAvailable(isUsernameAvailable);
    }
  }, [isUsernameAvailable]);

  const handleSave = async () => {
    if (username.length > 15) {
      toast.error("Username must be 15 characters or less");
      return;
    }
    if (!usernameAvailable) {
      toast.error("Username is already taken");
      return;
    }
    if (instagramHandle.length > 25) {
      toast.error("Instagram handle must be 25 characters or less");
      return;
    }
    if (tiktokHandle.length > 25) {
      toast.error("TikTok handle must be 25 characters or less");
      return;
    }
    try {
      await updateProfile({ name, username, instagramHandle, tiktokHandle });
      toast.success("Profile updated successfully");
      setDialogOpen(false); // Close the dialog
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
          aria-label="Edit Profile"
        >
          <Settings className="w-5 h-5 text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Username</label>
            <Input
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
            {!usernameAvailable && username.length > 0 && (
              <p className="text-sm text-red-500">Username is already taken</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Instagram Username</label>
            <Input
              value={instagramHandle}
              maxLength={25}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">TikTok Username</label>
            <Input
              value={tiktokHandle}
              maxLength={25}
              onChange={(e) => setTiktokHandle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;

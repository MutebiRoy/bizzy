// src/components/home/edit-profile-dialog.tsx
"use client";
import { useState, useEffect, useRef, } from "react";
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
import { Settings } from 'lucide-react';
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { isAuthenticated } = useConvexAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // State for image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const me = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

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
      setYoutubeHandle(me.youtubeHandle || "");
      setImagePreviewUrl(me.image || null);
    }
  }, [me]);

  useEffect(() => {
    if (isUsernameAvailable !== undefined) {
      setUsernameAvailable(isUsernameAvailable);
    }
  }, [isUsernameAvailable]);

  // Handle Change Profile Photo Change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfileEdit = async () => {
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
    if (youtubeHandle.length > 30) {
      toast.error("Youtube handle must be 30 characters or less");
      return;
    }
    if (name.trim().length < 2 || name.trim().length > 20) {
      toast.error("Name must be between 2 and 20 characters");
      return;
    }

    try {
      let imageStorageId: string | undefined = undefined;

      if (imageFile) {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload the image
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": imageFile.type,
          },
          body: imageFile,
        });

        if (!result.ok) {
          throw new Error(`Image upload failed with status ${result.status}`);
        }

        // Extract storageId from the response
        const { storageId } = await result.json();

        if (!storageId) {
          throw new Error("Failed to obtain storageId from upload response");
        }

        imageStorageId = storageId;
      }

      await updateProfile({ 
        name: name.trim(),
        username,
        instagramHandle,
        tiktokHandle,
        youtubeHandle,
        imageStorageId, 
      });
      toast.success("Profile updated successfully");
      setDialogOpen(false); // Close the dialog
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={imagePreviewUrl || "/placeholder.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              <button
                onClick={handleUploadClick}
                className="absolute bottom-0 right-0 bg-gray-800 text-white p-1 rounded-full"
              >
                Change
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 text-base"
            />
            {name.trim().length > 0 && (name.trim().length < 2 || name.trim().length > 20) && (
              <p className="text-sm text-red-500">
                Name must be between 2 and 20 characters.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Bizmous Handle</label>
            <Input
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 text-base"
            />
            {!usernameAvailable && username.length > 0 && (
              <p className="text-sm text-red-500">Username is already taken</p>
            )}
          </div>
          {/* Instagram Handle Input */}
          <div>
            <label className="block text-sm font-medium">Instagram Handle</label>
            <Input
              value={instagramHandle}
              maxLength={25}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="mt-1 text-base"
            />
            {instagramHandle.length > 25 && (
              <p className="text-sm text-red-500">
                Instagram handle must be 25 characters or less. Dont include @ symbol
              </p>
            )}
          </div>

          {/* TikTok Handle Input */}
          <div>
            <label className="block text-sm font-medium">TikTok Handle</label>
            <Input
              value={tiktokHandle}
              maxLength={25}
              onChange={(e) => setTiktokHandle(e.target.value)}
              className="mt-1 text-base"
            />
            {tiktokHandle.length > 25 && (
              <p className="text-sm text-red-500">
                TikTok handle must be 25 characters or less. Dont include @ symbol
              </p>
            )}
          </div>

          {/* Youtube Handle Input */}
          <div>
            <label className="block text-sm font-medium">Youtube Handle</label>
            <Input
              value={youtubeHandle}
              maxLength={30}
              onChange={(e) => setYoutubeHandle(e.target.value)}
              className="mt-1 text-base"
            />
            {youtubeHandle.length > 30 && (
              <p className="text-sm text-red-500">
                Youtube handle must be 30 characters or less. Dont include @ symbol
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveProfileEdit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default EditProfileDialog;
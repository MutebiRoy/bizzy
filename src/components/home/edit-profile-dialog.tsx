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
import { Settings, Tag } from 'lucide-react';
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENDER_OPTIONS = ["Male", "Female", "Custom", "Prefer not to say"] as const;
type GenderOption = typeof GENDER_OPTIONS[number];

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { isAuthenticated } = useConvexAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Gender states
  const [gender, setGender] = useState<GenderOption>("Prefer not to say");
  const [customGender, setCustomGender] = useState("");

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
      setTags(me.tags || []);
      
      // Set gender based on what is stored
      // If me.gender is set and is one of GENDER_OPTIONS, use it.
      // Else if me.gender is something else (custom), set to "Custom" and put value in customGender.
      if (me.gender) {
        if (GENDER_OPTIONS.includes(me.gender as GenderOption)) {
          setGender(me.gender as GenderOption);
        } else {
          // This means me.gender is custom
          setGender("Custom");
          setCustomGender(me.gender);
        }
      } else {
        // If no gender stored, default to "Prefer not to say"
        setGender("Prefer not to say");
      }
    }
  }, [me]);

  useEffect(() => {
    if (isUsernameAvailable !== undefined) {
      setUsernameAvailable(isUsernameAvailable);
    }
  }, [isUsernameAvailable]);

  // Add tags
  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 12) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  // remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
    if (name.trim().length < 2 || name.trim().length > 20) {
      toast.error("Name must be between 2 and 20 characters");
      return;
    }
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
    if (tags.length > 12) {
      toast.error("You can add up to 12 tags.");
      return;
    }

    // Determine final gender value to store
    if (gender === "Custom" && customGender.trim().length === 0) {
      toast.error("Please specify a custom gender or choose another option");
      return;
    }
    if (gender === "Custom" && customGender.trim().length > 25) {
      toast.error("Custom gender must be 25 characters or less");
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

      let finalGender: string;
      if (gender === "Custom") {
        finalGender = customGender.trim();
      } else {
        finalGender = gender; // "Male", "Female", or "Prefer not to say"
      }

      await updateProfile({ 
        name: name.trim(),
        username,
        instagramHandle,
        tiktokHandle,
        youtubeHandle,
        imageStorageId,
        tags,
        gender: finalGender || "Prefer not to say", // default if nothing set
      });
      toast.success("Profile updated successfully");
      setDialogOpen(false); // Close the dialog
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  // Limit customGender to 25 chars
  const customGenderLimit = 25;
  const customGenderLength = customGender.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Profile
          </DialogTitle>
          <DialogDescription>
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
          </DialogDescription>
        </DialogHeader>
        {/* <div className="space-y-4"> */}
          
        <div className='flex flex-col gap-3 overflow-auto max-h-80'>
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 text-base text-gray-500"
            />
            {name.trim().length > 0 && (name.trim().length < 2 || name.trim().length > 20) && (
              <p className="text-sm text-red-500">
                Name must be between 2 and 20 characters.
              </p>
            )}
          </div>

          {/* Gender Options */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <div className="flex flex-col gap-2">
              {GENDER_OPTIONS.map((option) => (
                <label key={option} className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={() => {
                      setGender(option as GenderOption);
                      if (option !== "Custom") {
                        setCustomGender("");
                      }
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {gender === "Custom" && (
              <div className="mt-2">
                <label className="block text-sm font-medium">Custom Gender</label>
                <Input
                  value={customGender}
                  onChange={(e) => {
                    if (e.target.value.length <= customGenderLimit) {
                      setCustomGender(e.target.value);
                    }
                  }}
                  className="mt-1 text-base text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customGenderLength}/{customGenderLimit} characters
                </p>
              </div>
            )}
          </div>
          
          {/* Bizmous Handle */}
          <div>
            <label className="block text-sm font-medium">Bizmous Handle</label>
            <Input
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 text-base text-gray-500"
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
              className="mt-1 text-base text-gray-500"
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
              className="mt-1 text-base text-gray-500"
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
              className="mt-1 text-base text-gray-500"
            />
            {youtubeHandle.length > 30 && (
              <p className="text-sm text-red-500">
                Youtube handle must be 30 characters or less. Dont include @ symbol
              </p>
            )}
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium">Tags (up to 12)</label>
            <div className="flex items-center mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-grow text-base"
              />
              <Button variant="secondary" onClick={addTag} className="ml-2">
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center space-x-1 bg-gray-200 px-2 py-1 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveProfileEdit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default EditProfileDialog;

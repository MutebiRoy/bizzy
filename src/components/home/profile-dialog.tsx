// src/components/home/profile-dialog.tsx
"use client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserType, ConversationType } from "@/utils/conversation_utils";

interface ProfileDialogProps {
  user?: UserType | null;
  conversation?: ConversationType | null;
  trigger: React.ReactNode;
}

const ProfileDialog = ({ user, conversation, trigger }: ProfileDialogProps) => {
  const isGroup = conversation?.isGroup;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {isGroup ? (
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={conversation?.groupImage || "/placeholder.png"} />
              <AvatarFallback>{conversation?.groupName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{conversation?.groupName}</h2>
            {/* Additional group information can be added here */}
          </div>
        ) : user ? (
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.image || "/placeholder.png"} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{
            <a
              href={`https://bizmous.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500"
            > 
              @{user.username}
            </a>
            }</p>

            {user.instagramHandle && (
              <p className="text-sm">
                Instagram{" "}
                <a
                  href={`https://instagram.com/${user.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500"
                >
                  @{user.instagramHandle}
                </a>
              </p>
            )}

            {user.tiktokHandle && (
              <p className="text-sm">
                TikTok{" "}
                <a
                  href={`https://tiktok.com/@${user.tiktokHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500"
                >
                  @{user.tiktokHandle}
                </a>
              </p>
            )}

            {user.youtubeHandle && (
              <p className="text-sm">
                Youtube{" "}
                <a
                  href={`https://youtube.com/@${user.youtubeHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500"
                >
                  @{user.youtubeHandle}
                </a>
              </p>
            )}
            
          </div>
        ) : (
          <p>User not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;

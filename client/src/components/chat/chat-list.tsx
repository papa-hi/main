import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Chat {
  id: number;
  participants: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  }[];
  lastMessage?: {
    id: number;
    content: string;
    sentAt: Date;
    senderId: number;
    senderName: string;
  };
  unreadCount: number;
}

interface ChatListProps {
  onSelectChat: (chatId: number) => void;
  selectedChatId?: number;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch all chats for the current user
  const { data: chats, isLoading, error } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });

  // Handle chat selection
  const handleChatClick = (chatId: number) => {
    onSelectChat(chatId);
  };

  // Get other participant's name for display
  const getOtherParticipantName = (chat: Chat) => {
    if (!user) return "Loading...";
    
    const otherParticipants = chat.participants.filter(p => p.id !== user.id);
    
    if (otherParticipants.length === 0) {
      return "No participants";
    } else if (otherParticipants.length === 1) {
      const participant = otherParticipants[0];
      return `${participant.firstName} ${participant.lastName}`;
    } else {
      // For group chats with multiple other participants
      return `${otherParticipants.length} participants`;
    }
  };

  // Get other participant's avatar for display
  const getOtherParticipantAvatar = (chat: Chat) => {
    if (!user) return null;
    
    const otherParticipants = chat.participants.filter(p => p.id !== user.id);
    
    if (otherParticipants.length === 0) {
      return null;
    } else {
      return otherParticipants[0];
    }
  };

  // Show error if chat loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>No chat conversations yet. Start connecting with other dads!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      {chats.map((chat) => {
        const otherParticipant = getOtherParticipantAvatar(chat);
        return (
          <Button
            key={chat.id}
            variant={selectedChatId === chat.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 px-3 relative"
            onClick={() => handleChatClick(chat.id)}
          >
            <Avatar>
              <AvatarImage 
                src={otherParticipant?.profileImage || undefined} 
                alt={getOtherParticipantName(chat)} 
              />
              <AvatarFallback>
                {otherParticipant 
                  ? otherParticipant.firstName[0] + otherParticipant.lastName[0] 
                  : "??"
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start truncate">
              <span className="font-medium">{getOtherParticipantName(chat)}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {chat.lastMessage 
                  ? chat.lastMessage.content 
                  : "No messages"
                }
              </span>
            </div>
            <div className="ml-auto flex flex-col items-end">
              {chat.lastMessage && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(new Date(chat.lastMessage.sentAt))}
                </span>
              )}
              {chat.unreadCount > 0 && (
                <Badge className="mt-1" variant="default">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
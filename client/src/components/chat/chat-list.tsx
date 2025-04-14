import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

interface ChatListProps {
  onSelectChat: (chatId: number) => void;
  selectedChatId?: number;
}

interface Chat {
  id: number;
  participants: { 
    id: number; 
    firstName: string; 
    lastName: string; 
    profileImage: string | null 
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

export function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: chats, isLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });
  
  // Filter out the current user from participants and filter by search query
  const filteredChats = chats?.filter(chat => {
    // Get the other participant in the chat (not the current user)
    const otherParticipants = chat.participants.filter(
      p => p.id !== user?.id
    );
    
    if (searchQuery.trim() === "") return true;
    
    // Check if any of the other participants match the search query
    return otherParticipants.some(
      p => 
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const getChatName = (chat: Chat) => {
    // Get names of all participants who are not the current user
    const otherParticipants = chat.participants.filter(
      p => p.id !== user?.id
    );
    
    if (otherParticipants.length === 0) return "Chat";
    
    return otherParticipants
      .map(p => `${p.firstName} ${p.lastName}`)
      .join(", ");
  };
  
  const getProfileImage = (chat: Chat) => {
    // Get profile image of the first participant who is not the current user
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    
    if (!otherParticipant) return null;
    
    return otherParticipant.profileImage || 
      `https://placehold.co/36x36/4F6F52/white?text=${otherParticipant.firstName[0]}`;
  };
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center space-x-4 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('chat.searchConversations', 'Search conversations...')}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredChats && filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery 
              ? t('chat.noMatchingChats', 'No matching conversations found') 
              : t('chat.noChats', 'No conversations yet')}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats?.map(chat => (
              <div 
                key={chat.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedChatId === chat.id ? 'bg-muted/70' : ''
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={getProfileImage(chat)} 
                      alt={getChatName(chat)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{getChatName(chat)}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {formatDate(new Date(chat.lastMessage.sentAt))}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate mt-1 ${
                      chat.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {chat.lastMessage
                        ? (chat.lastMessage.senderId === user?.id 
                            ? `${t('chat.you', 'You')}: ` 
                            : `${chat.lastMessage.senderName.split(' ')[0]}: `) + 
                          chat.lastMessage.content
                        : t('chat.noMessages', 'No messages yet')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
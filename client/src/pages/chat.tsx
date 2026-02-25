import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus } from "lucide-react";
import { useParams } from "wouter";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const params = useParams();
  const chatIdFromParams = params.id ? parseInt(params.id, 10) : null;
  const [selectedChatId, setSelectedChatId] = useState<number | null>(chatIdFromParams);
  const [showChatList, setShowChatList] = useState(!chatIdFromParams || !isMobile);

  useEffect(() => {
    if (chatIdFromParams) {
      setSelectedChatId(chatIdFromParams);
      if (isMobile) {
        setShowChatList(false);
      }
    }
  }, [chatIdFromParams, isMobile]);
  
  // Fetch all users to be able to start new chats
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/chats", { participants: [userId] });
      return await res.json();
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setSelectedChatId(newChat.id);
      if (isMobile) {
        setShowChatList(false);
      }
    },
  });
  
  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  };
  
  const handleBackToList = () => {
    setShowChatList(true);
  };
  
  const startNewChat = async (userId: number) => {
    await createChatMutation.mutateAsync(userId);
  };
  
  const otherUsers = users.filter((u) => u.id !== user?.id);
  
  return (
    <div className="h-full">
      <div className="max-w-6xl mx-auto">
        {/* Chat Expiration Notice */}
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md text-sm">
          <p>{t('chat.expirationNotice', 'Note: Chat messages are automatically deleted after one week for privacy.')}</p>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('chat.title', 'Messages')}</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                {t('chat.newChat', 'New Chat')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('chat.selectUser', 'Start a conversation')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {otherUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground">No other users available</p>
                ) : (
                  otherUsers.map((otherUser: User) => (
                    <Button
                      key={otherUser.id}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => startNewChat(otherUser.id)}
                    >
                      <span className="font-medium">{otherUser.firstName} {otherUser.lastName}</span>
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Chat list - hide on mobile when viewing a chat */}
          {(!isMobile || showChatList) && (
            <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r overflow-y-auto`}>
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChatId || undefined}
              />
            </div>
          )}
          
          {/* Chat interface - show when a chat is selected */}
          {(!isMobile || !showChatList) && selectedChatId ? (
            <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col`}>
              {isMobile && (
                <div className="p-2 border-b">
                  <Button variant="ghost" size="sm" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to chats
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <ChatInterface chatId={selectedChatId} />
              </div>
            </div>
          ) : (
            // Show placeholder when no chat is selected
            !isMobile && !showChatList && (
              <div className="w-2/3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">Select a chat or start a new conversation</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
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
  const [newChatOpen, setNewChatOpen] = useState(false);

  useEffect(() => {
    if (chatIdFromParams) {
      setSelectedChatId(chatIdFromParams);
      if (isMobile) {
        setShowChatList(false);
      }
    }
  }, [chatIdFromParams, isMobile]);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const createChatMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/chats", { participants: [userId] });
      return await res.json();
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setSelectedChatId(newChat.id);
      setNewChatOpen(false);
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

  const handleSelectUser = (userId: number) => {
    createChatMutation.mutate(userId);
  };

  const otherUsers = users.filter((u) => u.id !== user?.id);

  return (
    <div className="h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md text-sm">
          <p>{t('chat.expirationNotice', 'Note: Chat messages are automatically deleted after one week for privacy.')}</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('chat.title', 'Messages')}</h1>

          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setNewChatOpen(true)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              {t('chat.newChat', 'New Chat')}
            </Button>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {(!isMobile || showChatList) && (
            <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r overflow-y-auto`}>
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChatId || undefined}
              />
            </div>
          )}

          {(!isMobile || !showChatList) && selectedChatId ? (
            <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col`}>
              {isMobile && (
                <div className="p-2 border-b">
                  <Button variant="ghost" size="sm" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('chat.backToChats', 'Back to chats')}
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <ChatInterface chatId={selectedChatId} />
              </div>
            </div>
          ) : (
            !isMobile && !showChatList && (
              <div className="w-2/3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">{t('chat.selectChat', 'Select a chat or start a new conversation')}</p>
                </div>
              </div>
            )
          )}
        </div>

        {isMobile && showChatList && (
          <button
            onClick={() => setNewChatOpen(true)}
            className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
            aria-label={t('chat.newChat', 'New Chat')}
          >
            <MessageSquarePlus className="h-6 w-6" />
          </button>
        )}

        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogContent className="p-0 overflow-hidden sm:max-w-[450px]">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>{t('chat.selectUser', 'Start a conversation')}</DialogTitle>
            </DialogHeader>

            <Command>
              <CommandInput placeholder={t('chat.searchUsers', 'Search people...')} autoFocus />
              <CommandList className="max-h-[300px] overflow-y-auto p-2">
                <CommandEmpty>{t('chat.noUsersFound', 'No users found.')}</CommandEmpty>
                <CommandGroup>
                  {otherUsers.map((otherUser) => (
                    <CommandItem
                      key={otherUser.id}
                      value={`${otherUser.firstName} ${otherUser.lastName}`}
                      onSelect={() => handleSelectUser(otherUser.id)}
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      disabled={createChatMutation.isPending}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser.profileImage || undefined} alt={otherUser.firstName} />
                        <AvatarFallback>{otherUser.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{otherUser.firstName} {otherUser.lastName}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
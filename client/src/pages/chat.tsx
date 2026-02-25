import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, MessageSquarePlus, Search } from "lucide-react";
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
  const [userSearch, setUserSearch] = useState("");

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
      setUserSearch("");
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
  
  const otherUsers = users.filter((u) => u.id !== user?.id);
  const filteredUsers = otherUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    return u.firstName.toLowerCase().includes(query) || u.lastName.toLowerCase().includes(query);
  });
  
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('chat.selectUser', 'Start a conversation')}</DialogTitle>
            </DialogHeader>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('chat.searchUsers', 'Search users...')}
                className="pl-9"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="max-h-[50vh] mt-2">
              <div className="space-y-1 pr-3">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    {t('chat.noUsersFound', 'No users found')}
                  </p>
                ) : (
                  filteredUsers.map((otherUser: User) => (
                    <button
                      key={otherUser.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 active:bg-muted transition-colors text-left disabled:opacity-50"
                      disabled={createChatMutation.isPending}
                      onClick={() => createChatMutation.mutate(otherUser.id)}
                    >
                      <img
                        src={otherUser.profileImage || `https://placehold.co/40x40/4F6F52/white?text=${otherUser.firstName[0]}`}
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{otherUser.firstName} {otherUser.lastName}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
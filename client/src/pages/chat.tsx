import { useState } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatInterface from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  
  // Fetch all users (for starting new chats)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Handle chat selection
  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  // Handle back button in mobile view
  const handleBackToList = () => {
    setShowChatList(true);
  };

  // Start a new chat with a user
  const startNewChat = async (otherUserId: number) => {
    try {
      // Create a new chat with the selected user
      const response = await apiRequest("POST", "/api/chats", {
        participants: [otherUserId],
      });
      
      const newChat = await response.json();
      
      // Invalidate chats cache to reload the list
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      
      // Select the new chat
      setSelectedChatId(newChat.id);
      
      // Close the dialog
      setShowNewChatDialog(false);
      
      // In mobile view, switch to chat interface
      if (isMobile) {
        setShowChatList(false);
      }
      
      toast({
        title: "Chat Created",
        description: "You can now start messaging.",
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  // Filter out current user from users list
  const otherUsers = users.filter((u: User) => u.id !== user?.id);

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex flex-col h-[calc(100vh-180px)] rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Chat</DialogTitle>
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
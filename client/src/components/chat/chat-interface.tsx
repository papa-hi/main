import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatInterfaceProps {
  chatId: number;
}

interface ChatDetails {
  id: number;
  participants: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  }[];
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage, connected } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { data: chatDetails, isLoading: isLoadingChatDetails } = useQuery<ChatDetails>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId && !!user,
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages[chatId]]);
  
  // Get other participant for display
  const otherParticipant = chatDetails?.participants.find(p => p.id !== user?.id);
  
  const chatMessages = messages[chatId] || [];
  
  const handleSendMessage = async () => {
    if (!connected || !newMessage.trim() || isSending) return;
    
    try {
      setIsSending(true);
      await sendMessage(chatId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Loading state
  if (isLoadingChatDetails) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 flex flex-col space-y-4 py-4">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`flex items-start space-x-2 ${i % 2 === 0 ? 'self-end flex-row-reverse space-x-reverse' : ''}`}
            >
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-60'} rounded-lg`} />
            </div>
          ))}
        </div>
        <div className="flex space-x-2 pt-4 border-t">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center space-x-3">
        {otherParticipant && (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.profileImage ? `${otherParticipant.profileImage}?t=${new Date().getTime()}` : undefined} alt={otherParticipant.firstName} />
              <AvatarFallback>{otherParticipant.firstName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {otherParticipant.firstName} {otherParticipant.lastName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {connected ? t('chat.online') : t('chat.offline')}
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Chat Expiration Notice */}
      <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground text-center border-b">
        {t('chat.expirationNotice', 'Chat history is only kept for 1 week to ensure privacy')}
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollAreaRef}>
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-center">
                {t('chat.startConversation', 'Start a conversation with')} {otherParticipant?.firstName}
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isOwnMessage = msg.senderId === user?.id;
              const sender = isOwnMessage 
                ? user 
                : chatDetails?.participants.find(p => p.id === msg.senderId);
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={sender?.profileImage ? `${sender.profileImage}?t=${new Date().getTime()}` : undefined} 
                      alt={sender?.firstName || 'User'} 
                    />
                    <AvatarFallback>
                      {sender?.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1 max-w-[80%]">
                    <div 
                      className={`p-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(new Date(msg.sentAt))}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            placeholder={t('chat.typeMessage', 'Type a message...')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!connected || isSending}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!connected || !newMessage.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!connected && (
          <p className="text-xs text-destructive mt-2">
            {t('chat.connectionLost', 'Connection lost. Reconnecting...')}
          </p>
        )}
      </div>
    </div>
  );
}
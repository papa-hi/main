import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/utils";

interface ChatInterfaceProps {
  chatId: number;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { connected, connecting, sendMessage, messages } = useChat();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatMessages = messages[chatId] || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(chatId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>You must be logged in to chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 overflow-hidden">
        {!connected && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>{connecting ? "Connecting to chat..." : "Reconnecting..."}</p>
            </div>
          </div>
        )}
        
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.senderId === user.id ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.profileImage || undefined} alt={message.sender.firstName} />
                    <AvatarFallback>
                      {message.sender.firstName[0] + message.sender.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[70%] ${message.senderId === user.id ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.senderId === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTime(new Date(message.sentAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 border-t">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!connected}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!connected || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
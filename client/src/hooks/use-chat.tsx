import { createContext, ReactNode, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

type Message = {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  sentAt: Date;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
};

type ChatContextType = {
  connected: boolean;
  connecting: boolean;
  sendMessage: (chatId: number, content: string) => Promise<void>;
  messages: Record<number, Message[]>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const socketRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!user || socketRef.current?.readyState === WebSocket.OPEN) return;

    setConnecting(true);

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      // Authenticate the connection with user info
      socket.send(
        JSON.stringify({
          type: "authenticate",
          token: "dummy-token", // In a real app, you'd use a real token
          userId: user.id,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type === "authenticated") {
        setConnected(true);
        setConnecting(false);
      } else if (data.type === "new_message") {
        // Add message to the appropriate chat
        const message = data.message;
        setMessages((prevMessages) => {
          const chatMessages = [...(prevMessages[message.chatId] || [])];
          // Check if message already exists
          if (!chatMessages.some((m) => m.id === message.id)) {
            chatMessages.push(message);
            // Sort by sent time
            chatMessages.sort(
              (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
          }
          return {
            ...prevMessages,
            [message.chatId]: chatMessages,
          };
        });
      } else if (data.type === "error") {
        toast({
          title: "Chat Error",
          description: data.message,
          variant: "destructive",
        });
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setConnected(false);
      setConnecting(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (user) connectWebSocket();
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server. Retrying...",
        variant: "destructive",
      });
      setConnected(false);
      setConnecting(false);
    };

    socketRef.current = socket;
  }, [user, toast]);

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (user && !socketRef.current) {
      connectWebSocket();
    }

    // Cleanup function to close WebSocket when component unmounts
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, connectWebSocket]);

  // Function to send a message
  const sendMessage = async (chatId: number, content: string) => {
    if (!connected || !socketRef.current) {
      toast({
        title: "Not Connected",
        description: "You are not connected to the chat server",
        variant: "destructive",
      });
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "chat_message",
        chatId,
        content,
      })
    );
  };

  // Load initial messages for a chat from REST API
  const loadMessages = useCallback(async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await response.json();
      
      setMessages((prevMessages) => ({
        ...prevMessages,
        [chatId]: data,
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Preload messages when chat context is used
  useEffect(() => {
    const preloadActiveChats = async () => {
      if (!user) return;
      
      try {
        const response = await fetch("/api/chats");
        if (!response.ok) {
          throw new Error("Failed to load chats");
        }
        const chats = await response.json();
        
        // Load messages for each chat
        for (const chat of chats) {
          loadMessages(chat.id);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    };
    
    preloadActiveChats();
  }, [user, loadMessages]);

  return (
    <ChatContext.Provider value={{ connected, connecting, sendMessage, messages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
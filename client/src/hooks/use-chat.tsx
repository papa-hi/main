import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

// Message expiration time: 1 week in milliseconds
const MESSAGE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>(() => {
    try {
      // Load messages from localStorage with expiration check
      const storedData = localStorage.getItem('papa-hi-chat-messages');
      if (storedData) {
        const { messages, timestamp } = JSON.parse(storedData);
        const now = Date.now();

        // Check if data is expired (older than 1 week)
        if (now - timestamp < MESSAGE_EXPIRATION_TIME) {
          return messages;
        } else {
          console.log('Chat messages have expired, clearing cache');
          localStorage.removeItem('papa-hi-chat-messages');
        }
      }
    } catch (err) {
      console.error('Error loading cached messages:', err);
    }
    return {};
  });
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      setConnecting(true);
      
      try {
        // Choose the appropriate protocol based on the current connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host || "localhost:5000"; // Fallback to default port
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
        const newSocket = new WebSocket(wsUrl);
        
        newSocket.onopen = () => {
          console.log("WebSocket connection established");
          setConnected(true);
          setConnecting(false);
          
          // Clear any existing reconnect timeouts
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          
          // Authenticate the connection
          if (user) {
            console.log("Authenticating WebSocket connection...");
            newSocket.send(JSON.stringify({
              type: 'authenticate',
              userId: user.id,
              token: 'mock-token' // In a real implementation, use a real auth token
            }));
          }
        };
        
        newSocket.onclose = () => {
          console.log("WebSocket connection closed");
          setConnected(false);
          
          // Set up reconnection
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connectWebSocket();
            }, 3000);
          }
        };
        
        newSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
        
        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "initial_messages") {
              // Handle initial messages batch from server (after connecting or requesting messages)
              setMessages((prevMessages) => {
                // Get existing messages for this chat
                const existingMessages = prevMessages[data.chatId] || [];
                
                // Check which messages are new
                const newMessages = data.messages.filter(
                  (newMsg: Message) => !existingMessages.some((existingMsg) => existingMsg.id === newMsg.id)
                );
                
                // If no new messages, return existing state
                if (newMessages.length === 0) {
                  return prevMessages;
                }
                
                // Combine existing and new messages
                const combinedMessages = [...existingMessages, ...newMessages];
                
                // Sort by sent time
                combinedMessages.sort((a, b) => 
                  new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                );
                
                const updatedMessages = {
                  ...prevMessages,
                  [data.chatId]: combinedMessages
                };
                
                // Store to localStorage with timestamp
                localStorage.setItem('papa-hi-chat-messages', JSON.stringify({
                  messages: updatedMessages,
                  timestamp: Date.now()
                }));
                
                return updatedMessages;
              });
              
              console.log(`Loaded ${data.messages.length} messages for chat ${data.chatId} from server`);
            }
            else if (data.type === "message") {
              const message = data.message;
              
              setMessages((prevMessages) => {
                const chatMessages = [...(prevMessages[message.chatId] || [])];
                
                // Check if the message already exists
                const messageExists = chatMessages.some(m => m.id === message.id);
                
                if (!messageExists) {
                  chatMessages.push(message);
                  
                  // Sort messages by sentAt
                  chatMessages.sort((a, b) => {
                    return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
                  });
                }
                
                const updatedMessages = {
                  ...prevMessages,
                  [message.chatId]: chatMessages,
                };
                
                // Store updated messages to localStorage with timestamp
                localStorage.setItem('papa-hi-chat-messages', JSON.stringify({
                  messages: updatedMessages,
                  timestamp: Date.now()
                }));
                
                return updatedMessages;
              });
            // We already handle initial_messages above
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        
        setSocket(newSocket);
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setConnecting(false);
        
        // Schedule reconnection attempt
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, 5000);
        }
      }
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  // Load initial messages for a chat when it's opened
  const loadInitialMessages = (chatId: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: "get_messages",
      chatId: chatId,
    }));
  };

  // Send a message via WebSocket
  const sendMessage = async (chatId: number, content: string): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection not open");
    }

    socket.send(JSON.stringify({
      type: "send_message",
      chatId: chatId,
      content: content,
    }));
  };

  // Subscribe to messages when a chat is opened
  useEffect(() => {
    if (!socket || !connected) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // When the tab becomes visible, reload messages
        Object.keys(messages).forEach((chatId) => {
          loadInitialMessages(parseInt(chatId));
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, connected, messages]);
  
  // Check for expired messages on component mount and periodically
  useEffect(() => {
    const checkExpiredMessages = () => {
      try {
        const storedData = localStorage.getItem('papa-hi-chat-messages');
        if (storedData) {
          const { timestamp } = JSON.parse(storedData);
          const now = Date.now();
          
          // If the stored timestamp is older than the expiration time, clear messages
          if (now - timestamp >= MESSAGE_EXPIRATION_TIME) {
            console.log('Chat messages have expired, clearing cache');
            localStorage.removeItem('papa-hi-chat-messages');
            setMessages({});
          }
        }
      } catch (err) {
        console.error('Error checking message expiration:', err);
      }
    };
    
    // Check on component mount
    checkExpiredMessages();
    
    // Set interval to check daily
    const dailyCheck = setInterval(checkExpiredMessages, 24 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(dailyCheck);
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        connected,
        connecting,
        sendMessage,
        messages,
      }}
    >
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
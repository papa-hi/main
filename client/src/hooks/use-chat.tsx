import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

const RECONNECT_BASE_DELAY = 3000;
const RECONNECT_MAX_DELAY = 30000;

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
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // Messages are never persisted to localStorage — they are loaded fresh from
  // the server on every connection via get_messages. This prevents private
  // conversations from accumulating in plain text on shared/compromised devices.
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  // Clear in-memory messages when the user logs out
  useEffect(() => {
    if (!user) {
      setMessages({});
      // Also remove any stale data left by older app versions
      try { localStorage.removeItem('papa-hi-chat-messages'); } catch { /* ignore */ }
    }
  }, [user]);

  useEffect(() => {
    unmountedRef.current = false;
    if (!user) return;

    const connectWebSocket = () => {
      if (unmountedRef.current) return;
      setConnecting(true);

      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host || "localhost:5000";
        const wsUrl = `${protocol}//${host}/ws`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (unmountedRef.current) { ws.close(); return; }
          console.log("WebSocket connected (session auth)");
          setConnected(true);
          setConnecting(false);
          reconnectAttemptsRef.current = 0;

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        ws.onclose = (event) => {
          if (unmountedRef.current) return;
          console.log(`WebSocket closed: code=${event.code}`);
          setConnected(false);
          socketRef.current = null;

          if (event.code === 4001) {
            console.log("WebSocket auth failed — refreshing session and retrying");
            setConnecting(false);
            fetch('/api/user', { credentials: 'include' })
              .then((res) => {
                if (res.ok && !unmountedRef.current) {
                  reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectTimeoutRef.current = null;
                    connectWebSocket();
                  }, RECONNECT_BASE_DELAY);
                }
              })
              .catch(() => {});
            return;
          }

          const attempt = reconnectAttemptsRef.current;
          const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempt), RECONNECT_MAX_DELAY);
          reconnectAttemptsRef.current = attempt + 1;

          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connectWebSocket();
            }, delay);
          }
        };

        ws.onerror = () => {
          // onclose will fire after this
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "initial_messages") {
              setMessages((prev) => {
                const existing = prev[data.chatId] || [];
                const incoming = data.messages.filter(
                  (m: Message) => !existing.some((e) => e.id === m.id)
                );
                if (incoming.length === 0) return prev;

                const combined = [...existing, ...incoming].sort(
                  (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                );
                return { ...prev, [data.chatId]: combined };
              });
            } else if (data.type === "message") {
              const msg = data.message;
              setMessages((prev) => {
                const chatMsgs = [...(prev[msg.chatId] || [])];
                if (chatMsgs.some((m) => m.id === msg.id)) return prev;

                chatMsgs.push(msg);
                chatMsgs.sort(
                  (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                );
                return { ...prev, [msg.chatId]: chatMsgs };
              });
            }
          } catch {
            // ignore parse errors
          }
        };

        socketRef.current = ws;
      } catch {
        setConnecting(false);
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      unmountedRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user?.id]);

  const sendMessage = useCallback(async (chatId: number, content: string): Promise<void> => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection not open");
    }
    ws.send(JSON.stringify({ type: "send_message", chatId, content }));
  }, []);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (!connected) return;

    const handleVisibilityChange = () => {
      const ws = socketRef.current;
      if (document.visibilityState === "visible" && ws && ws.readyState === WebSocket.OPEN) {
        Object.keys(messagesRef.current).forEach((chatId) => {
          ws.send(JSON.stringify({ type: "get_messages", chatId: parseInt(chatId) }));
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [connected]);

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

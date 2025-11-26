import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatbotWidgetProps {
  type: "sales" | "patient";
  clinicId?: string;
  clinicName?: string;
  brandColor?: string;
}

const STORAGE_KEY = "chatbot_manually_closed";
const AUTO_OPEN_DELAY = 10000;
const AUTO_MINIMIZE_DELAY = 8000;

export function ChatbotWidget({
  type,
  clinicId,
  clinicName = "DentalLeadGenius",
  brandColor = "#3B82F6",
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoMinimizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wasManuallyClosedThisSession = useCallback(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  const setManuallyClosed = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  }, []);

  const cancelAutoMinimizeTimer = useCallback(() => {
    if (autoMinimizeTimerRef.current) {
      clearTimeout(autoMinimizeTimerRef.current);
      autoMinimizeTimerRef.current = null;
    }
  }, []);

  const markUserInteracted = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      cancelAutoMinimizeTimer();
    }
  }, [hasUserInteracted, cancelAutoMinimizeTimer]);

  // Auto-open after 10 seconds (only once, and only if not manually closed)
  useEffect(() => {
    if (!hasAutoOpened && !wasManuallyClosedThisSession()) {
      autoOpenTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        setHasAutoOpened(true);
        setShowGreeting(true);
      }, AUTO_OPEN_DELAY);
    }

    return () => {
      if (autoOpenTimerRef.current) {
        clearTimeout(autoOpenTimerRef.current);
      }
    };
  }, [hasAutoOpened, wasManuallyClosedThisSession]);

  // Auto-minimize after a few seconds (only once, only if user hasn't interacted)
  useEffect(() => {
    if (isOpen && hasAutoOpened && !hasUserInteracted && !wasManuallyClosedThisSession()) {
      autoMinimizeTimerRef.current = setTimeout(() => {
        if (!hasUserInteracted) {
          setIsOpen(false);
        }
      }, AUTO_MINIMIZE_DELAY);
    }

    return () => {
      cancelAutoMinimizeTimer();
    };
  }, [isOpen, hasAutoOpened, hasUserInteracted, wasManuallyClosedThisSession, cancelAutoMinimizeTimer]);

  // Fetch messages for the thread
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/chatbot/messages", threadId],
    enabled: !!threadId && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chatbot/send", {
        threadId,
        type,
        clinicId,
        message: content,
      });
      const data = await response.json();
      return data as { threadId: string; message: string };
    },
    onSuccess: (data) => {
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages", data.threadId] });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && !threadId && messages.length === 0 && showGreeting) {
      const timer = setTimeout(() => {
        sendMessageMutation.mutate(
          type === "sales"
            ? "Hello! I'm interested in learning more about DentalLeadGenius."
            : "Hi, I'd like to book an appointment."
        );
        setShowGreeting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, threadId, messages.length, type, showGreeting]);

  const handleSend = () => {
    if (!message.trim()) return;
    markUserInteracted();
    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    markUserInteracted();
    setMessage(e.target.value);
  };

  const handleInputFocus = () => {
    markUserInteracted();
  };

  const handleOpen = () => {
    markUserInteracted();
    setIsOpen(true);
    setShowGreeting(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setManuallyClosed();
    cancelAutoMinimizeTimer();
  };

  const handleChatAreaClick = () => {
    markUserInteracted();
  };

  const handleHeaderClick = () => {
    markUserInteracted();
  };

  // Minimized bubble state
  if (!isOpen) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
        data-testid="chatbot-bubble"
      >
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 px-4 py-3 text-white"
          style={{ backgroundColor: brandColor }}
          data-testid="button-open-chatbot"
        >
          <Avatar className="h-8 w-8 border-2 border-white/30">
            <AvatarImage src="/favicon.png" />
            <AvatarFallback className="text-xs bg-white/20 text-white">AI</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium whitespace-nowrap">Chat with us</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
        </button>
      </div>
    );
  }

  // Expanded chat window
  return (
    <div
      className="fixed z-50 flex flex-col bg-card rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300
        bottom-0 right-0 left-0 h-[55vh] 
        sm:bottom-4 sm:right-4 sm:left-auto sm:h-[65vh] sm:max-h-[600px] sm:w-[380px] sm:rounded-2xl
        md:bottom-6 md:right-6"
      style={{ maxHeight: "calc(100vh - 100px)" }}
      data-testid="chatbot-widget"
      onClick={handleChatAreaClick}
    >
      {/* Header */}
      <div
        className="p-3 sm:p-4 rounded-t-2xl flex items-center justify-between text-white flex-shrink-0 cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-white/30">
            <AvatarImage src="/favicon.png" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm" data-testid="text-chatbot-title">
              {type === "sales" ? "Sarah - Lead Specialist" : `${clinicName} Assistant`}
            </h3>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 bg-green-400 rounded-full" />
              <span className="text-xs text-white/90">Online</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center justify-center h-10 w-10 rounded-full text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          data-testid="button-close-chatbot"
          aria-label="Minimize chat"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 p-3 sm:p-4 overflow-y-auto" 
        ref={scrollRef}
        onClick={handleChatAreaClick}
      >
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              data-testid={`message-${msg.role}-${msg.id}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
                style={
                  msg.role === "user"
                    ? { backgroundColor: brandColor, color: "white" }
                    : {}
                }
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sendMessageMutation.isPending && (
            <div className="flex justify-start gap-2">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span
                    className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full text-sm"
            data-testid="input-chatbot-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="rounded-full flex-shrink-0"
            style={{ backgroundColor: brandColor }}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}

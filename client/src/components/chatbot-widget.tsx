import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  autoOpen?: boolean;
  autoOpenDelay?: number;
}

export function ChatbotWidget({
  type,
  clinicId,
  clinicName = "DentalLeadGenius",
  brandColor = "#3B82F6",
  autoOpen = false,
  autoOpenDelay = 2500,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-open behavior for homepage
  useEffect(() => {
    if (autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, autoOpenDelay, isOpen]);

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
      // Invalidate with the specific thread to refetch messages
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
    if (isOpen && !threadId && messages.length === 0) {
      const timer = setTimeout(() => {
        sendMessageMutation.mutate(
          type === "sales"
            ? "Hello! I'm interested in learning more."
            : "Hi, I'd like to book an appointment."
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, threadId, messages.length, type]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50"
        style={{ backgroundColor: brandColor }}
        onClick={() => setIsOpen(true)}
        data-testid="button-open-chatbot"
      >
        <MessageCircle className="h-7 w-7 text-white" />
        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
      </Button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 w-96 h-[600px] bg-card rounded-2xl shadow-2xl flex flex-col z-50 border animate-in slide-in-from-bottom-4 duration-300"
      data-testid="chatbot-widget"
    >
      {/* Header */}
      <div
        className="p-4 rounded-t-2xl flex items-center justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/30">
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
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/20"
          onClick={() => setIsOpen(false)}
          data-testid="button-close-chatbot"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
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
              <Avatar className="h-8 w-8 flex-shrink-0">
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
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full"
            data-testid="input-chatbot-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="rounded-full"
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

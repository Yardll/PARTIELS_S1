import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, MessageSquarePlus, Trash2, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useConversation, useCreateConversation, useDeleteConversation, useChatStream } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  currentCode?: string;
}

export function ChatPanel({ currentCode }: ChatPanelProps) {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingList } = useConversations();
  const { data: activeConversation, isLoading: loadingChat } = useConversation(activeChatId);
  const createChat = useCreateConversation();
  const deleteChat = useDeleteConversation();
  const { sendMessage, isStreaming, streamedContent } = useChatStream(activeChatId || 0);

  // Auto-select first chat
  useEffect(() => {
    if (!activeChatId && conversations && conversations.length > 0) {
      setActiveChatId(conversations[0].id);
    }
  }, [conversations, activeChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamedContent]);

  const handleCreateChat = () => {
    createChat.mutate("New Chat", {
      onSuccess: (newChat) => setActiveChatId(newChat.id),
    });
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;
    
    // Optional: context injection
    let messageToSend = input;
    if (currentCode && input.toLowerCase().includes("explain") && input.toLowerCase().includes("code")) {
      messageToSend = `${input}\n\nHere is my current code:\n\`\`\`cpp\n${currentCode}\n\`\`\``;
    }

    const tempInput = input;
    setInput("");
    await sendMessage(messageToSend);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteChat.mutate(id);
    if (activeChatId === id) setActiveChatId(null);
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="panel-header">
        <span className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI Assistant
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 hover:bg-background/50"
          onClick={handleCreateChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List (Horizontal if space allows, usually sidebar style) */}
      {!activeChatId && (
        <div className="flex-1 p-4 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-4">
          <Bot className="h-12 w-12 opacity-20" />
          <p>Select or create a conversation to start chatting.</p>
          <Button onClick={handleCreateChat} size="sm">
            Start New Chat
          </Button>
          
          <div className="w-full mt-4 space-y-2">
            {conversations?.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className="p-2 text-left bg-background/50 rounded cursor-pointer hover:bg-background border border-transparent hover:border-border transition-colors text-xs truncate"
              >
                {chat.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      {activeChatId && (
        <>
          <ScrollArea className="flex-1 p-4" viewportRef={scrollRef as any}>
            <div className="space-y-4">
              {activeConversation?.messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-3 text-sm",
                    msg.role === "assistant" ? "bg-transparent" : "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                  )}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "rounded-lg p-3 max-w-[85%]",
                    msg.role === "assistant" 
                      ? "bg-background border border-border" 
                      : "bg-primary text-primary-foreground"
                  )}>
                     <ReactMarkdown 
                        className="prose prose-invert prose-sm max-w-none break-words"
                        components={{
                          code: ({node, inline, className, children, ...props}: any) => {
                            return inline ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-muted p-2 rounded text-xs font-mono my-2 overflow-x-auto" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {isStreaming && (
                <div className="flex gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 max-w-[85%]">
                    <ReactMarkdown className="prose prose-invert prose-sm">
                      {streamedContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background/30">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0" 
                title="Explain Code"
                onClick={() => {
                  if (currentCode) {
                    setInput("Explain this code for me.");
                    setTimeout(() => handleSend(), 100); // Quick hack to auto-send
                  }
                }}
              >
                <Code2 className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask AI..."
                className="bg-background border-input"
              />
              <Button 
                onClick={handleSend} 
                size="icon" 
                disabled={isStreaming || !input.trim()}
                className={isStreaming ? "opacity-50" : ""}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

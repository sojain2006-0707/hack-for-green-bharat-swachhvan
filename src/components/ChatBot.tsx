import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { askRAG } from "@/lib/vanService";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  confidence?: string;
};

const SUGGESTIONS = [
  "How do I book a van?",
  "What are the prices?",
  "Is it safe for women?",
  "How does payment work?",
  "Where are vans available?",
  "How clean are the washrooms?",
  "What is Refer & Earn?",
  "How does waste management work?",
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm SwachhVan AI Assistant. Ask me anything about our washroom van services, hygiene standards, or booking process.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askRAG(q);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.answer,
        source: res.sources?.[0]?.category,
        confidence: res.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Sorry, I couldn't reach the AI server. Please try again later.",
        },
      ]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg ring-2 ring-white/50 transition-transform hover:scale-105 active:scale-95"
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">SwachhVan AI</p>
            <p className="text-[10px] opacity-80">Powered by Pathway RAG</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20" aria-label="Close chat">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-foreground",
              )}
            >
              {msg.text}
              {msg.source && (
                <p className="mt-1 text-[10px] opacity-60">Source: {msg.source}</p>
              )}
              {msg.confidence !== undefined && (
                <p className="text-[10px] opacity-60">Confidence: {msg.confidence}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-200 text-gray-600">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (show only if few messages) */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-foreground ring-1 ring-black/5 transition hover:bg-emerald-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-gray-100 px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm outline-none ring-1 ring-black/5 placeholder:text-muted-foreground focus:ring-emerald-500"
          disabled={loading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={!input.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PaperPlaneRight,
  Trash,
  X,
  Copy,
  Check,
  Barbell,
  ForkKnife,
  Funnel,
  ClockAfternoon
} from "@phosphor-icons/react";
import { BrandLogo } from "./BrandLogo";
import api from "../services/api.service";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const QUICK_ACTIONS = [
  { label: "Diet Plan", icon: ForkKnife, prompt: "Generate a high-protein muscle building diet plan" },
  { label: "Workout Split", icon: Barbell, prompt: "Generate a 5-day Push Pull Legs workout split" },
  { label: "Filter Pending Dues", icon: Funnel, prompt: "Show members with pending payments" },
  { label: "Filter Expiring (7d)", icon: ClockAfternoon, prompt: "Show members expiring in 7 days" }
];

export function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "init",
      role: "assistant",
      text:
        "**Welcome to GymGenius AI Assistant!**\n\n" +
        "I specialize in personalized fitness training, customized nutrition plans, and gym member management.\n\n" +
        "**What I can do for you:**\n" +
        "- **Generate Workout Routines**: Ask for PPL, Upper/Lower, 3 to 6-day splits, hypertrophy, or fat loss workouts.\n" +
        "- **Generate Custom Diet Plans**: Request high protein, muscle building, fat loss, vegetarian, vegan, or keto protocols.\n" +
        "- **Filter & Search Members**: Filter members with pending payments, expiring in 7 days, or by membership plan.\n\n" +
        "Click a quick action button below or type your request.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    const userMsg: ChatEntry = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setSending(true);

    try {
      const response = await api.post("/ai/chat", { message: text });
      const data = response.data as { reply: string };

      const assistantMsg: ChatEntry = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: data.reply || "Request processed successfully.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        "Unable to reach the assistant right now. Please try again.";

      const assistantMsg: ChatEntry = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: `**Notice:** ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init_${Date.now()}`,
        role: "assistant",
        text:
          "**Conversation cleared.**\n\n" +
          "How can I help you today? Choose a quick action below to generate workout splits or customized diet protocols.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderBubbleContent = (entry: ChatEntry) => {
    const rawText = entry.text;
    const lines = rawText.split("\n");

    return (
      <div className="chat-simple-content">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} style={{ height: "6px" }} />;

          // Heading 3
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={idx} style={{ margin: "10px 0 6px 0", fontSize: "14px", fontWeight: 800, color: "#fbbf24" }}>
                {trimmed.replace(/^###\s*/, "")}
              </h3>
            );
          }

          // Heading 4
          if (trimmed.startsWith("#### ")) {
            return (
              <h4 key={idx} style={{ margin: "8px 0 4px 0", fontSize: "13px", fontWeight: 700, color: "#fef08a" }}>
                {trimmed.replace(/^####\s*/, "")}
              </h4>
            );
          }

          // Highlight bold text
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx} style={{ color: "#ffffff", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (trimmed.startsWith("• ") || trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return (
              <div key={idx} className="chat-simple-bullet">
                <span className="chat-bullet-symbol">-</span>
                <span>{formattedLine}</span>
              </div>
            );
          }

          if (trimmed.startsWith("> ")) {
            return (
              <blockquote key={idx} className="chat-simple-quote">
                {trimmed.replace(/^>\s*/, "")}
              </blockquote>
            );
          }

          return <p key={idx} className="chat-simple-p">{formattedLine}</p>;
        })}

        {/* Copy Button for Assistant Responses */}
        {entry.role === "assistant" && entry.id !== "init" && (
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="chat-wa-copy-btn"
              onClick={() => handleCopy(entry.id, entry.text)}
              title="Copy to clipboard"
            >
              {copiedId === entry.id ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
              <span>{copiedId === entry.id ? "Copied" : "Copy Plan"}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  if (!open) {
    return createPortal(
      <button className="chat-simple-launcher" onClick={() => setOpen(true)} title="Open GymGenius AI Assistant">
        <BrandLogo size={22} />
        <span className="chat-launcher-label">GymGenius AI</span>
        <span className="chat-launcher-status-dot" />
      </button>,
      document.body
    );
  }

  return createPortal(
    <div className="chat-simple-modal">
      {/* HEADER */}
      <div className="chat-simple-header">
        <div className="chat-header-left">
          <BrandLogo size={28} />
          <div>
            <div className="chat-header-title">GymGenius AI</div>
            <div className="chat-header-sender">AI Fitness &amp; Member Protocol Assistant</div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="chat-header-actions-simple">
          <button
            type="button"
            className="chat-header-btn-simple"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <Trash size={15} weight="bold" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            className="chat-header-btn-simple chat-close-btn"
            onClick={() => setOpen(false)}
            title="Close Assistant"
          >
            <X size={17} weight="bold" />
          </button>
        </div>
      </div>

      {/* MESSAGES CONTAINER */}
      <div className="chat-simple-messages" ref={scrollRef}>
        {messages.map((entry) => {
          const isUser = entry.role === "user";
          return (
            <div
              key={entry.id}
              className={`chat-simple-row ${isUser ? "chat-row-user" : "chat-row-assistant"}`}
            >
              <div className={`chat-simple-card ${isUser ? "chat-card-user" : "chat-card-assistant"}`}>
                {renderBubbleContent(entry)}
                <div className="chat-simple-meta">
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="chat-simple-row chat-row-assistant">
            <div className="chat-simple-card chat-card-assistant chat-simple-typing">
              <span className="chat-pulse-indicator" />
              <span>Generating tailored fitness protocol...</span>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="chat-simple-quick-bar">
        {QUICK_ACTIONS.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <button
              key={idx}
              type="button"
              className="chat-quick-btn"
              onClick={() => sendMessage(item.prompt)}
              disabled={sending}
            >
              <IconComp size={13} weight="bold" style={{ marginRight: "4px" }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* INPUT BAR */}
      <div className="chat-simple-input-bar">
        <input
          ref={inputRef}
          type="text"
          value={input}
          placeholder="Ask for a workout split, diet plan, or filter members..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="chat-simple-input"
        />
        <button
          type="button"
          className="chat-simple-send-btn"
          onClick={() => sendMessage()}
          disabled={sending || !input.trim()}
          title="Send"
        >
          <span>Send</span>
          <PaperPlaneRight size={16} weight="bold" />
        </button>
      </div>
    </div>,
    document.body
  );
}
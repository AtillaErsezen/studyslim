'use client';

import { useState, useEffect } from "react";
import TypingText from "@/components/ui/shadcn-io/typing-text/";

function viewProfile(tutorId: string) {
  window.open(`/tutor/${tutorId}`, '_blank');
}

export default function AIChatPanel() {
  // Helper to render stars for rating
  function renderStars(rating: number | undefined) {
    if (!rating || isNaN(rating)) return '—';
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <span style={{ color: '#FFD700', fontSize: '1.1em', letterSpacing: '1px', verticalAlign: 'middle' }}>
        {'★'.repeat(fullStars)}
        {halfStar ? <span style={{ color: '#FFD700' }}>☆</span> : ''}
        <span style={{ color: '#bbb' }}>{'☆'.repeat(emptyStars)}</span>
      </span>
    );
  }

  const STORAGE_KEY = 'studyslim_chat_messages';
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; tutors?: any[]; isTyping?: boolean }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all loaded messages have isTyping set to false
        return parsed.map((msg: any) => ({ ...msg, isTyping: false }));
      }
    }
    return [];
  });

  // Agent response controller. Set NEXT_PUBLIC_MOCK_ANSWER=true to enable mock responses (no API calls).
  const MOCK_ANSWER = true;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save messages without isTyping flag to prevent replaying effect
      const messagesWithoutTyping = messages.map(m => ({ ...m, isTyping: false }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesWithoutTyping));
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMessage = { role: "user" as const, content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      if (MOCK_ANSWER) {
        // Simulate network latency and return a deterministic mock response without calling the API.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const parsedTutors = [
          { id: 'mock-1', name: 'Alice Mock', image: '', ratingAvg: 4.8, hourlyRate: 35, isAvailable: true },
          { id: 'mock-2', name: 'Bob Example', image: '', ratingAvg: 4.5, hourlyRate: 30, isAvailable: true },
          { id: 'mock-3', name: 'Charlie Demo', image: '', ratingAvg: 4.2, hourlyRate: 25, isAvailable: true },
        ];
        const aiMessage = {
          role: "assistant" as const,
          content: 'Here are the tutors I found for you. (mock)',
          tutors: parsedTutors,
          isTyping: true,
        };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/ai_next_js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const result = await res.json();
      if (result.success) {
        // Parse tutors array from response and attach to a single assistant message
        let parsedTutors: any[] = [];
        try {
          parsedTutors = typeof result.data.response === "string"
            ? JSON.parse(result.data.response)
            : result.data.response;
          if (!Array.isArray(parsedTutors)) parsedTutors = [];
        } catch (e) {
          parsedTutors = [];
        }
        const aiMessage = {
          role: "assistant" as const,
          content: 'Here are the tutors I found for you.',
          tutors: parsedTutors,
          isTyping: true,
        };
        console.log('Adding aiMessage');
        console.log(aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      }
      else {
        const errorMessage = { role: "assistant" as const, content: "Sorry, I couldn't process your request." };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage = { role: "assistant" as const, content: "Sorry, there was an error processing your request." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative grid grid-rows-[1fr_auto] h-[80vh] rounded-lg border border-border bg-background text-foreground">
      <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-900/50">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ask anything about your course, exam date, or learning needs.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={`flex ${m.role === "user" ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm
                    ${m.role === "user" ? "bg-primary" : "bg-violet"}`}>
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm
                    ${m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-white border border-gray-100 text-gray-700 rounded-bl-none"
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {m.role === "assistant" && m.isTyping ? (
                      <TypingText 
                        text={m.content} 
                        typingSpeed={20}
                        onSentenceComplete={() => {
                          setMessages(prev => prev.map((msg, idx) => 
                            idx === i ? { ...msg, isTyping: false } : msg
                          ));
                        }}
                      />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              {/* Tutor suggestion cards (rendered from component-level `tutors` state) */}
              {m.role === "assistant" && Array.isArray(m.tutors) && m.tutors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {m.tutors.map((tutor: any) => (
                    <div key={tutor.id ?? tutor.name} 
                    className="bg-card border border-border rounded-lg p-3 min-w-[220px] text-foreground flex flex-col justify-between cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        {tutor.image ? (
                          <img src={tutor.image} alt={tutor.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xs">No Img</div>
                        )}
                        <div>
                          <div className="font-bold text-lg mb-1 primary">{tutor.name}</div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground">{renderStars(tutor.ratingAvg)}{tutor.ratingAvg ? ` (${tutor.ratingAvg}/5)` : ''}</span>
                          </div>
                          <div className="text-xs mb-1 text-muted-foreground">Rate: €{tutor.hourlyRate ?? '—'}/hr</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-muted-foreground">Available:</span>
                        {tutor.isAvailable ? (
                          <span title="Available" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#34D399"/><path d="M5.5 8.5L7.5 10.5L10.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                        ) : (
                          <span title="Not available" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-500"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#6B7280"/><path d="M5.5 10.5L10.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                        )}
                      </div>
                      <button className="mt-3 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold shadow" onClick={() => viewProfile(tutor.id)}>View Profile</button>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex w-full justify-start">
            <div className="flex flex-row items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-violet flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm">
                AI
              </div>
              <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe your course, topics, exam date, preferred language..."
          className="flex-1 rounded-md border border-primary bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button onClick={send} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow transition-all">Send</button>
        <button 
          onClick={clearChat}
          className="text-sm text-primary px-2 font-medium"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
// --- Types and Helper Functions ---
// A single Message type that can hold either text or tutor data
type Message =
  | { id: string; role: "user" | "assistant"; type: "text"; content: string }
  | { id: string; role: "assistant"; type: "tutors"; content: Tutor[] };

type Tutor = {
  id: string;
  name: string;
  image?: string;
  ratingAvg?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
};

function renderStars(rating?: number) {
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

// --- Updated DemoChat Component ---
export default function DemoChat() {
  // 1. Initial state with just the first message
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", type: "text", content: "Hey! I have access to 12,400+ past exams and tutor profiles. What course are you struggling with?" },
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  // 2. Updated sequence in useEffect
  useEffect(() => {
    let mounted = true;
    const sequence = async () => {
      // --- Step 1: User asks for a tutor ---
      await delay(1500);
      if (!mounted) return;
      push({ id: "u1", role: "user", type: "text", content: "I'm looking for a linear algebra tutor at UvA" });

      // --- Step 2: AI provides course info ---
      await delay(1500);
      if (!mounted) return;
      push({ id: "a1", role: "assistant", type: "text", content: "Linear Algebra at UvA is known for being quite theoretical! It covers vector spaces, linear transformations, and eigenvalues. The final exam is usually a mix of proofs and computations." });

      // --- Step 3: AI introduces tutors ---
      await delay(1500);
      if (!mounted) return;
      push({ id: "a2", role: "assistant", type: "text", content: "Based on that, here are 3 excellent tutors who have aced this specific course:" });

      // --- Step 4: Simulate loading and then add tutor cards as a message ---
      await delay(800);
      if (!mounted) return;
      setLoading(true);
      await delay(1200);
      if (!mounted) return;
      setLoading(false);
      push({
        id: "a_tutors",
        role: "assistant",
        type: "tutors",
        content: [
          { id: 't1', name: 'Lars V.', image: '', ratingAvg: 4.9, hourlyRate: 35, isAvailable: true },
          { id: 't2', name: 'Sarah K.', image: '', ratingAvg: 4.7, hourlyRate: 30, isAvailable: true },
          { id: 't3', name: 'Ahmed H.', image: '', ratingAvg: 4.5, hourlyRate: 28, isAvailable: true },
        ]
      });

      // --- Step 5: User says thank you ---
      await delay(2000);
      if (!mounted) return;
      push({ id: "u2", role: "user", type: "text", content: "Thank you!" });

      // --- Step 6: AI final response ---
      await delay(1500);
      if (!mounted) return;
      push({ id: "a3", role: "assistant", type: "text", content: "You're welcome! Always here to help! Is there anything else I can help you with?" });
    };
    sequence();
    return () => { mounted = false; };
  }, []);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Use setTimeout to ensure the DOM has updated with the new message/loading indicator
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    }
  }, [messages, loading]);

  // (Helper functions)
  function push(m: Message) {
    setMessages((s) => [...s, m]);
  }

  function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // --- Rendering Logic ---
  return (
    <div className="relative w-full max-w-2xl md:max-w-2xl h-[420px] md:h-[520px] lg:h-[600px]">
      {/* Decor */}
      <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-violet/10 rounded-3xl opacity-50 rotate-6 transform translate-x-4" />

      {/* Chat UI */}
      <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transform hover:scale-[1.01] transition-transform duration-500">
        {/* Visual back-to-home button */}
        {/*<button
          aria-label="Back to Home (demo)"
          onClick={(e) => e.preventDefault()}
          className="absolute top-4 left-4 z-40 inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm text-sm text-foreground hover:shadow-lg transition-shadow duration-150 ease-in-out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </button> */}
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center px-6 justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-violet-dark flex items-center justify-center text-white text-xs font-bold">AI</div>
            <div>
              <div className="text-xs font-bold text-carbon">StudySlim AI</div>
              <div className="text-[10px] text-lime font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-lime" /> Online</div>
            </div>
          </div>
          <div className="text-gray-300">⋯</div>
        </div>

        {/* Messages Container */}
        <div ref={containerRef} className="flex-1 p-5 space-y-4 overflow-y-auto chat-scroll bg-gray-50/50">
          {messages.map((m) => (
            <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* Text Message */}
              {m.type === 'text' && (
                <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm
                    ${m.role === 'user' ? 'bg-primary' : 'bg-violet'}`}>
                    {m.role === 'user' ? 'U' : 'AI'}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                    }`}>
                    {m.content}
                  </div>
                </div>
              )}

              {/* Tutor Cards Message */}
              {m.type === 'tutors' && (
                // REMOVED max-w-[90%] constraint here
                <div className="flex flex-wrap gap-3">
                  {m.content.map((tutor) => (
                    <div key={tutor.id} 
                    className="bg-white border border-gray-200 rounded-lg p-3 min-w-[220px] text-foreground flex flex-col justify-between cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
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
                      <button className="mt-3 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold shadow">View Profile</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
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

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input type="text" disabled placeholder="Describe your course, topics, exam date, preferred language..." className="bg-transparent w-full text-sm outline-none text-gray-600" />
            <button className="w-8 h-8 bg-violet text-white rounded-full flex items-center justify-center text-xs hover:scale-105 transition"><svg viewBox="0 0 24 24" className="w-3 h-3"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow transition-all">Send</button>
            <button
              className="text-sm text-primary px-2 font-medium"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
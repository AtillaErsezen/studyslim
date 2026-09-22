"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'tutor' | 'student';
  text: string;
}

const CONVERSATION_SCRIPT = [
  { 
    role: 'student', 
    text: "Hi! I saw your profile. I'm really struggling with Linear Algebra 1. Specifically eigenvalues and proofs." 
  },
  { 
    role: 'tutor', 
    text: "Hi there! I can definitely help with that. I got an 8.5 in that course last year. What exactly are you finding difficult?" 
  },
  { 
    role: 'student', 
    text: "Mostly the abstract vector space proofs. I just don't know where to start with them." 
  },
  { 
    role: 'tutor', 
    text: "Got it. Those are tricky. We can start by reviewing the core theorems and then walk through some past exam problems. How many hours a week were you thinking?" 
  },
  { 
    role: 'student', 
    text: "Maybe 2 hours a week? I have the resit in a month." 
  },
  { 
    role: 'tutor', 
    text: "2 hours sounds perfect. We can do two 1-hour sessions. Does Thursday evening work for you?" 
  },
  { 
    role: 'student', 
    text: "Yes, Thursday at 7 PM works great. Let's do it!" 
  },
  { 
    role: 'tutor', 
    text: "Awesome! I'll send you the booking request now. Looking forward to it!" 
  }
];

export default function DemoChatTutor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const playNextMessage = () => {
      if (currentIndex >= CONVERSATION_SCRIPT.length) return;

      const nextMsg = CONVERSATION_SCRIPT[currentIndex];
      
      // FIX: Only show typing indicator if the STUDENT is typing.
      // We don't want to show a typing indicator for the Tutor ("Me"), 
      // as that would appear on the left side (Student side) and confuse the user.
      if (nextMsg.role === 'student') {
        setIsTyping(true);
      }
      
      const typingTime = nextMsg.text.length * 30 + 500; // Dynamic typing speed

      timeoutId = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: nextMsg.role as 'tutor' | 'student', 
          text: nextMsg.text 
        }]);
        
        currentIndex++;
        // Delay before next message starts
        timeoutId = setTimeout(playNextMessage, 1500); 
      }, typingTime);
    };

    // Start delay
    timeoutId = setTimeout(playNextMessage, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    // Changed max-w-md to max-w-xl to make it wider
    <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
                <div className="font-semibold text-sm">New Request</div>
                <div className="text-xs text-muted-foreground">Linear Algebra • 2h/week</div>
            </div>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-violet-100 text-violet-700 rounded-full">Active</div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-900/50 scroll-smooth">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex w-full ${msg.role === 'tutor' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${msg.role === 'tutor' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm
                  ${msg.role === 'tutor' ? 'bg-primary' : 'bg-slate-400'}`}>
                  {msg.role === 'tutor' ? 'Me' : 'S'}
                </div>

                {/* Bubble */}
                <div className={`p-3 rounded-2xl text-sm shadow-sm
                  ${msg.role === 'tutor' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex w-full justify-start"
          >
             <div className="flex flex-row items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-500">...</span>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
             </div>
          </motion.div>
        )}
      </div>

      {/* Input Area (Mock) */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex gap-2">
            <div className="h-10 flex-1 bg-slate-100 rounded-full px-4 flex items-center text-sm text-gray-400 cursor-not-allowed">
                Reply to student...
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5">
                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
            </div>
        </div>
      </div>
    </div>
  );
}
"use client";

// 1. Standard React and Next imports
import {useState, useRef, memo } from "react";
import React from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion"; // Import motion for the sliding effect
import {useSession} from "@/lib/auth-client";
import {Loader2} from 'lucide-react';

// 2. CSS imports
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

// --- DYNAMIC IMPORTS ---
const GravityStarsBackground = dynamic(
  () => import('@/components/animate-ui/components/backgrounds/gravity-stars').then(mod => mod.GravityStarsBackground),
  { ssr: false }
);

const Marquee = dynamic(() => import('react-fast-marquee'), {
  ssr: false
});

const Swiper = dynamic(() => import('swiper/react').then(mod => mod.Swiper), {
  ssr: false
});
const SwiperSlide = dynamic(() => import('swiper/react').then(mod => mod.SwiperSlide), {
  ssr: false
});
import { Autoplay, Navigation, Pagination } from 'swiper/modules'; 

const Slides = dynamic(() => import('@/components/animate-ui/primitives/effects/slide').then(mod => mod.Slides), {
  ssr: false
});
const TextGenerateEffect = dynamic(() => import('@/components/ui/shadcn-io/text-generate-effect').then(mod => mod.TextGenerateEffect), {
    ssr: false
});

// 3. UI Component imports
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { HighlightText } from '@/components/ui/shadcn-io/highlight-text';
import {
  InputButton,
  InputButtonAction,
  InputButtonProvider,
  InputButtonSubmit,
  InputButtonInput,
} from '@/components/ui/shadcn-io/input-button';

// Lazy load demo chat components with loading placeholders
const DemoChat = dynamic(() => import('@/components/demo/DemoChat'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full max-w-2xl md:max-w-2xl h-[420px] md:h-[520px] lg:h-[600px]">
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 animate-pulse" />
    </div>
  )
});

const TutorDemoChat = dynamic(() => import('@/components/demo/TutorDemoChat'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-xl h-[500px] bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 animate-pulse" />
  )
});


export default function Home() {
  const {data: session, isPending} = useSession();
  const [activeTab, setActiveTab] = useState("students");
  
  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="w-full bg-background border-b px-8 py-4">
          <div className="h-8 w-32 bg-slate-200 animate-pulse rounded" />
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }
  
  // 1. Controlled State for Tabs

  return (
    // Pass value and onValueChange to make it controlled
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="min-h-screen bg-background text-foreground flex flex-col"
    >
      {/* Pass activeTab and session to TopNav for the animation */}
      <TopNav activeTab={activeTab} session={session} />
      
      {/* 2. Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center">
        
        <TabsContent value="students" className="w-full mt-0 border-0 p-0 data-[state=inactive]:hidden">
          <StudentView session={session} />
        </TabsContent>
        
        <TabsContent value="tutors" className="w-full mt-0 border-0 p-0 data-[state=inactive]:hidden">
          <TutorView session={session} />
        </TabsContent>
      </div>

      <Footer />
    </Tabs>
  );
}

// --- UPDATED TOP NAV WITH SLIDING ANIMATION ---
function TopNav({ activeTab, session }: { activeTab: string; session: any }) {
  const router = useRouter();
  
  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/register');
    }
  };

  return (
    <nav className="w-full bg-background border-b border-border flex items-center justify-between px-8 py-4 sticky top-0 z-50">
      <div className="text-2xl font-bold primary cursor-pointer shrink-0" onClick={() => window.location.href = '/'}>
        Study<span className="text-primary">Slim</span>
      </div>

      {/* CENTERED TABS LIST WITH ANIMATION */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <TabsList className="grid w-[300px] grid-cols-2 relative bg-muted/20 p-1 rounded-lg">
          
          {/* Student Trigger */}
          <TabsTrigger 
            value="students" 
            className="relative z-10 bg-muted data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200"
          >
            <span className={activeTab === "students" ? "text-foreground font-medium" : "text-muted-foreground"}>
              For Students
            </span>
            {/* The Sliding Pill */}
            {activeTab === "students" && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-white dark:bg-zinc-950 shadow-sm rounded-md z-[-1]"
                transition={{ type: "spring", bounce: 0, duration: 0.7 }}
              />
            )}
          </TabsTrigger>

          {/* Tutor Trigger */}
          <TabsTrigger 
            value="tutors" 
            className="relative z-10 bg-muted data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200"
          >
             <span className={activeTab === "tutors" ? "text-foreground font-medium" : "text-muted-foreground"}>
               For Tutors
             </span>
             {/* The Sliding Pill */}
             {activeTab === "tutors" && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-white dark:bg-zinc-950 shadow-sm rounded-md z-[-1]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </TabsTrigger>

        </TabsList>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button onClick={handleGetStarted} className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-semibold shadow-lg hover:bg-violet-700 transition-all hover:-translate-y-1">
          Get Started
        </button>
      </div>
    </nav>
  );
}

function StudentView({ session }: { session: any }) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    // Check if user is logged in first
    if (!session) {
      router.push('/register');
      return;
    }

    const searchText = searchInputRef.current?.value || "";

    if (searchText.trim() !== "") {
      try {
          const res = await fetch('/api/ai/ai_next_js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: searchText }),
          });
          const result = await res.json();
          const STORAGE_KEY = 'studyslim_chat_messages';
          const existingMessages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const userMessage = { role: "user" as const, content: searchText };
          let newMessages = [...existingMessages, userMessage];
          if (result.success) {
            console.log('AI Response from main page:', result.data.response);
            const aiMessage = {
              role: "assistant" as const,
              content: 'Here are the tutors I found for you.',
              tutors: typeof result.data.response === "string" ? JSON.parse(result.data.response) : (result.data.response || [])
            };
            newMessages.push(aiMessage);
          } else {
            console.error('AI Error:', result.error);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      } catch (e) {
          console.error("Failed to fetch tutors", e);
      }
    }
    router.push('/dashboard');
  };

  return (
    <>
      <main className="flex-1 w-full flex flex-col items-center px-4">
        {/* Top area with decorative background */}
        <div className="w-full relative">
          <GravityStarsBackground className="absolute inset-0 pointer-events-none rounded-xl" starsCount={100}/>
          <div className="relative z-10">
            <div className="w-full my-8 flex flex-col md:flex-row justify-center items-center md:items-center gap-1 px-4 pl-60">
              <div className="w-full md:w-1/2 flex justify-start">
                <HeroPanel searchInputRef={searchInputRef} handleSearch={handleSearch} />
              </div>
              <div className="w-full md:w-1/2 flex justify-end items-start">
                <DemoChat />
              </div>
            </div>
          </div>
        </div>

        <TrustedUniversities />
        <ShortcutPanel />
        <FeaturesPanel />
        <FeedbackPanel />
      </main>
      <section className="w-full max-w-4xl mx-auto py-8">
        <h2 className="text-3xl font-bold text-center mb-6">FAQ</h2>
        <div className="flex justify-center">
          <RadixAccordionDemo />
        </div>
      </section>
    </>
  );
}

function TutorView({ session }: { session: any }) {
  const router = useRouter();
  
  const handleBecomeTutor = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 pt-10">
        <div className="w-full relative">
          {/* Reusing Gravity Background for consistency */}
          <GravityStarsBackground className="absolute inset-0 pointer-events-none rounded-xl opacity-50" starsCount={100} glowIntensity={35}/>
          
          <div className="relative z-10 w-full my-12 flex flex-col md:flex-row justify-center items-center gap-12 px-4 max-w-7xl mx-auto">
             
             {/* Left: Text Content */}
             <div className="w-full md:w-1/2 flex flex-col items-start space-y-6 pl-4 md:pl-20">
                <div className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm">
                   For Top Students & TAs
                </div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                   Turn your <span className="text-primary">Grades</span> into <span className="text-primary">Income</span>.
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                   Set your own rates, choose your own hours, and help students master the courses you aced. We handle the payments and booking—you just teach.
                </p>
                <div className="flex gap-4 pt-2">
                   <button onClick={handleBecomeTutor} className="bg-primary text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-violet-700 transition-all hover:-translate-y-1">
                      Become a Tutor
                   </button>
                   <button className="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-lg font-semibold shadow-sm hover:bg-slate-50 transition-all">
                      Calculate Earnings
                   </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white"></div>
                      <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white"></div>
                   </div>
                   <p>Join 500+ tutors from UvA, VU, and Leiden.</p>
                </div>
             </div>

             {/* Right: The New DemoChatTutor */}
             <div className="w-full md:w-1/2 flex justify-center md:justify-end pr-4 md:pr-10">
                <TutorDemoChat />
             </div>
          </div>
        </div>
      
      {/* Reusing existing panels for now */}
      <div className="mt-20">
         <TutorShortcutPanel />
      </div>
      <TutorFeaturesPanel />
       {/* FAQ can be shared or specific to Tutors */}
      <section className="w-full max-w-4xl mx-auto py-20">
        <h2 className="text-3xl font-bold text-center mb-6">Tutor FAQ</h2>
        <div className="flex justify-center">
          <RadixAccordionDemo />
        </div>
      </section>
    </div>
  );
}

const HeroPanel = memo(function HeroPanel({
  searchInputRef,
  handleSearch
}: {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  handleSearch: () => void;
}) {
  const [placeholder, setPlaceholder] = useState("What course or topic do you need help with?");

  return (
    <section className="w-full h-full flex justify-start items-start pt-16 pb-4 pr-20">
      <div className="w-full flex justify-start items-start gap-8 relative">

        <div className="max-w-2xl flex-shrink-0 flex flex-col items-start text-left py-8 md:py-0 min-h-[420px] -ml-20">
          <TextGenerateEffect
            words={`Master your courses with`}
            className="text-2xl md:text-4xl text-center max-w-2xl mx-auto mb-6"
            duration={0.6}
            staggerDelay={0.10}
          />
          <div className="w-full flex justify-center">
            <span className="inline-flex items-baseline gap-3 mt-2">
              <HighlightText className="text-2xl md:text-4xl font-bold leading-tight" text={"AI-Powered"} />
              <TextGenerateEffect
                words={`Tutoring`}
                className="text-2xl md:text-4xl text-center max-w-2xl mx-auto mb-6"
                duration={0.6}
                staggerDelay={0.10}
              />
            </span>
          </div>
          <p className="text-lg text-[var(--color-muted-foreground)] mb-6 max-w-xl text-center">Connect with expert tutors matched by AI or get 24/7 study assistance for any subject. Smarter learning starts here.</p>

          <Slides
            className="w-full md:w-[38rem] lg:w-[44rem] xl:w-[52rem] mt-2 transform translate-y-10"
            direction="down"
            offset={60}
            delay={100}
            transition={{ type: 'spring', stiffness: 190, damping: 10 }}
          >
            <div className="w-full">
              <InputButtonProvider>
                <div className="flex-1">
                  <InputButtonInput
                    ref={searchInputRef}
                    type="text"
                    placeholder={placeholder}
                    onFocus={() => setPlaceholder("")}
                  />
                </div>
                <InputButton>
                  <InputButtonAction>Start Searching</InputButtonAction>
                  <InputButtonSubmit onClick={handleSearch}>
                    Ask AI
                  </InputButtonSubmit>
                </InputButton>
              </InputButtonProvider>
            </div>
          </Slides>
        </div>
      </div>
    </section>
  );
});

const TrustedUniversities = memo(function TrustedUniversities() {
  const logos = [
    '/images/university_logos/uva.png',
    '/images/university_logos/vu.svg',
    '/images/university_logos/hoge.png',
    '/images/university_logos/leiden.png',
    '/images/university_logos/delft.png',
    '/images/university_logos/erasmus.png',
    '/images/university_logos/utrecht.png'
  ];

  return (
    <section 
      id="universities" 
      className="w-full border-y border-gray-200 bg-white py-12 relative overflow-hidden section-tracker mt-24"
    >
      <header className="mb-8" aria-labelledby="trusted-universities-heading">
        <h1 id="trusted-universities-heading" className="text-center text-[var(--color-muted-foreground)] text-xl font-medium">
          TRUSTING STUDENTS FROM:
        </h1>
      </header>

      <Marquee autoFill={true} speed={30} className="overflow-hidden">
        {logos.map((src, i) => (
          <div key={i} className="w-40 h-50 flex items-center justify-center overflow-hidden flex-shrink-0 mx-12">
            <img src={src} alt="University logo" className="w-full h-full object-contain" />
          </div>
        ))}
      </Marquee>
    </section>
  );
});

const ShortcutPanel = memo(function ShortcutPanel(){
  return (
    <section id="how-it-works" className="py-24 bg-cream relative z-10 section-tracker h-fit flex flex-col justify-center items-center rounded-3xl">
    <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-carbon mb-4">The StudiSlim Shortcut</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">We skip the awkward browsing. You get straight to the solution.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl group border border-transparent hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 w-full shadow-sm group-hover:-translate-y-2 transition-transform">
                        <div className="flex gap-2 items-center">
                            <div className="w-2 h-2 rounded-full bg-violet"></div>
                            <div className="h-2 w-24 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">1. Ask the AI</h3>
                <p className="text-gray-600">Tell us your course code (e.g., 'Linear Algebra 1'). We scan the syllabus to understand exactly what you are stuck on.</p>
            </div>
        <div className="bg-white p-8 rounded-3xl group border border-violet/30 shadow-violet-glow hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end">
                    <div className="bg-carbon text-white rounded-xl p-3 w-full shadow-lg transform transition-transform flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-lime/20 border border-lime flex items-center justify-center text-lime text-xs font-bold">L</div>
                        <div className="flex-1">
                            <div className="h-2 w-16 bg-gray-500 rounded mb-1"></div>
                            <div className="h-1.5 w-10 bg-lime rounded"></div>
                        </div>
                        <i className="fa-solid fa-check-circle text-lime"></i>
                    </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">2. The Perfect Match</h3>
                <p className="text-gray-600">We instantly pair you with a student who got an 8.5+ in that exact course. No browsing profiles.</p>
            </div>
        <div className="bg-white p-8 rounded-3xl group border border-transparent hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end relative">
                    <div className="absolute bottom-0 w-full h-1 bg-gray-200 rounded"></div>
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-violet rounded-full border-2 border-white"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md text-carbon group-hover:-translate-y-2 transition-transform">UB Library</div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">3. Meet on Campus</h3>
                <p className="text-gray-600">Meet at the library or a cafe on campus. In-person, real connection, high-bandwidth learning.</p>
            </div>
        </div>
    </div>
</section>
  );
});

const TutorShortcutPanel = memo(function TutorShortcutPanel(){
  return (
    <section id="how-it-works" className="py-24 bg-cream relative z-10 section-tracker min-h-[80vh] flex flex-col justify-center items-center rounded-3xl">
    <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 -ml-8">
            <h2 className="font-display text-4xl font-bold text-carbon mb-4">The StudiSlim Shortcut</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">We skip the awkward browsing. You get straight to the solution.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl group border border-transparent hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 w-full shadow-sm group-hover:-translate-y-2 transition-transform">
                        <div className="flex gap-2 items-center">
                            <div className="w-2 h-2 rounded-full bg-violet"></div>
                            <div className="h-2 w-24 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">1. Verify Your Grades</h3>
                <p className="text-gray-600">Instead of a generic sign-up, emphasize the "quality" aspect. You upload a transcript, we verify you got an 8.0+, and you're in.</p>
            </div>
        <div className="bg-white p-8 rounded-3xl group border border-violet/30 shadow-violet-glow hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end">
                    <div className="bg-carbon text-white rounded-xl p-3 w-full shadow-lg transform transition-transform flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-lime/20 border border-lime flex items-center justify-center text-lime text-xs font-bold">L</div>
                        <div className="flex-1">
                            <div className="h-2 w-16 bg-gray-500 rounded mb-1"></div>
                            <div className="h-1.5 w-10 bg-lime rounded"></div>
                        </div>
                        <i className="fa-solid fa-check-circle text-lime"></i>
                    </div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">2. Accept Requests</h3>
                <p className="text-gray-600">Tutors don't have to hunt for students. We notify them when a student needs help with their specific course.</p>
            </div>
        <div className="bg-white p-8 rounded-3xl group border border-transparent hover:border-violet-200 transition-colors duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
                <div className="h-20 mb-6 flex items-end relative">
                    <div className="absolute bottom-0 w-full h-1 bg-gray-200 rounded"></div>
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-violet rounded-full border-2 border-white"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md text-carbon group-hover:-translate-y-2 transition-transform">UB Library</div>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">3. Teach & Get Paid</h3>
                <p className="text-gray-600">Focus on the result. Do the session (online or campus) and the money hits your account automatically.</p>
            </div>
        </div>
    </div>
</section>
  );
});

const FeaturesPanel = memo(function FeaturesPanel() {
  return (
    <section className="w-full max-w-4xl mx-auto py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-3 text-center mb-8">
        <h2 className="font-display text-4xl font-bold text-carbon">Features for Students</h2>
        <p className="text-[var(--color-muted-foreground)] mt-2">Everything you need to ace your courses.</p>
      </div>
      <FeatureCard
        imgSrc="/images/features/match.png"
        title="AI Matching"
        description="AI Matching combines help tutoring tutors and expert learners."
      />
      <FeatureCard
        imgSrc="/images/features/7_24.png"
        title="24/7 AI Assist"
        description="24/7 AI Assist, tutors get any subject assistance."
      />
      <FeatureCard
        imgSrc="/images/features/tutor.png"
        title="Verified Experts"
        description="Verified Experts for trusted, quality help."
      />
    </section>
  );
});

const TutorFeaturesPanel = memo(function TutorFeaturesPanel() {
  return (
    <section className="w-full max-w-4xl mx-auto py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-3 text-center mb-8">
        <h2 className="font-display text-4xl font-bold text-carbon">Features for Tutors</h2>
        <p className="text-[var(--color-muted-foreground)] mt-2">Everything you need to ace your courses.</p>
      </div>
      <FeatureCard
        imgSrc="/images/features/rates.svg"
        title="Flexible Rates"
        description="Freedom and control over your income."
      />
      <FeatureCard
        imgSrc="/images/features/marketing.svg"
        title="Zero Marketing"
        description="Platform does the work of finding students for you."
      />
      <FeatureCard
        imgSrc="/images/features/payment.svg"
        title="Guaranteed Payments"
        description="Safety and reliability."
      />
    </section>
  );
});

const FeedbackPanel = memo(function FeedbackPanel() {
  const feedbacks = [
    {
      quote: "StudySlim's AI matching found me the perfect tutor for my calculus class. The sessions were incredibly helpful and I aced my exam!",
      student: "Anna K., UvA Student"
    },
    {
      quote: "The 24/7 AI assist feature saved me during finals week. I got instant answers to my questions anytime, day or night.",
      student: "Mark T., VU Student"
    },
    {
      quote: "All tutors are verified and professional. I felt confident booking sessions and the quality of teaching was outstanding.",
      student: "Lisa R., Leiden Student"
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto py-52">
      <h2 className="text-3xl font-bold text-center mb-10 primary">What Our Students Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {feedbacks.map((fb, i) => (
          <div key={i} className="bg-white dark:bg-card border border-border rounded-lg p-6 shadow-lg flex flex-col relative">
            <p className="text-lg italic mb-6 flex-1 text-foreground">
              <span className="text-4xl text-primary mr-2">"</span>
              {fb.quote}
              <span className="text-4xl text-primary ml-2">"</span>
            </p>
            <p className="text-right font-semibold text-primary">- {fb.student}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

interface FeatureCardProps {
  imgSrc?: string;
  title: string;
  description: string;
}

function FeatureCard({ imgSrc, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white border border-border rounded-lg p-6 flex flex-col items-center text-center shadow duration-300 shadow-lg hover:-translate-y-2 hover:shadow-xl  transform transition-transform">
      {imgSrc ? (
        <img src={imgSrc} alt={title + ' icon'} className="w-16 h-16 mb-4 object-contain" />
      ) : null}
      <div className="font-bold text-lg mb-2">{title}</div>
      <div className="text-[var(--color-muted-foreground)] text-base">{description}</div>
    </div>
  );
}

const ITEMS = [
  {
    title: 'What is StudySlim?',
    content:
      "StudySlim connects students with vetted tutors and AI study tools — a single place to find, book, and get help for any course or topic.",
  },
  {
    title: 'How does AI tutor matching work?',
    content:
      "Our AI analyzes your course name, topic and preferences, then ranks qualified tutors by expertise, availability and student feedback so you get fast, relevant matches.",
  },
  {
    title: 'How do I book and pay for a session?',
    content:
      "Search or ask the AI, review matched tutors, then book a timeslot. Payments are handled securely at checkout — no payment details are shared with tutors.",
  },
  {
    title: 'Are tutors verified?',
    content:
      "Yes — tutors complete a verification process that includes identity checks, qualification review, and student feedback before they appear in search results.",
  },
  {
    title: 'What if I need help outside booked sessions?',
    content:
      "Use our 24/7 AI Assist for on-demand explanations, practice questions, and quick answers; it complements scheduled tutoring sessions.",
  },
  {
    title: 'What is the pricing and refund policy?',
    content:
      "Pricing is set by tutors with clear hourly rates. Refunds for canceled or unsatisfactory sessions follow the policy shown at checkout — contact support for disputes.",
  },
  {
    title: 'How is my data used and protected?',
    content:
      "We store only necessary data, use encryption in transit and at rest, and never sell personal information. See our Privacy Policy for full details.",
  },
  {
    title: 'How do I contact support?',
    content:
      "Use the Contact form below, email support@studyslim.example, or visit the Dashboard 'Help' section — we usually respond within one business day.",
  },
];

type RadixAccordionDemoProps = {
  multiple?: boolean;
  collapsible?: boolean;
  keepRendered?: boolean;
  showArrow?: boolean;
};

const RadixAccordionDemo = ({
  multiple = false,
  collapsible = true,
  keepRendered = false,
  showArrow = true,
}: RadixAccordionDemoProps) => {
  return (
    <Accordion type={multiple ? 'multiple' : 'single'} collapsible={collapsible} className="max-w-[400px] w-full">
      {ITEMS.map((item, index) => (
        <AccordionItem key={index} value={`item-${index + 1}`}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[var(--color-muted-foreground)]">© {new Date().getFullYear()} StudiSlim. All rights reserved.</div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="/register" className="hover:underline">Register</a>
          <a href="/login" className="hover:underline">Login</a>
          <a href="/dashboard" className="hover:underline">Dashboard</a>
        </div>
      </div>
    </footer>
  );
}
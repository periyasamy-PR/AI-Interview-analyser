import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { MockInterview, InterviewMessage } from '../types';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, PhoneOff, CheckCircle2, User, Bot, Loader2, Volume2, VolumeX, Target, TrendingUp, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

// Helper function to dynamically merge browser speech transcripts with input buffer to prevent word duplication
function mergeSpeechTranscripts(base: string, sessionFinal: string): string {
  base = base.trim();
  sessionFinal = sessionFinal.trim();
  if (!base) return sessionFinal;
  if (!sessionFinal) return base;

  const baseWords = base.split(/\s+/);
  const finalWords = sessionFinal.split(/\s+/);

  let overlapLength = 0;
  const maxCheck = Math.min(baseWords.length, finalWords.length);

  for (let len = 1; len <= maxCheck; len++) {
    const baseSlice = baseWords.slice(baseWords.length - len).join(" ").toLowerCase();
    const finalSlice = finalWords.slice(0, len).join(" ").toLowerCase();
    if (baseSlice === finalSlice) {
      overlapLength = len;
    }
  }

  if (overlapLength > 0) {
    const nonOverlappingFinal = finalWords.slice(overlapLength).join(" ");
    return (base + (nonOverlappingFinal ? " " + nonOverlappingFinal : "")).trim();
  }

  return (base + " " + sessionFinal).trim();
}

export default function Interview() {
  const { user: authUser, profile } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<MockInterview | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState<'info' | 'analytics' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const baseTextRef = useRef('');
  const currentFinalTextRef = useRef('');
  const shouldBeRecordingRef = useRef(false);
  const inputTextRef = useRef(inputText);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // Speech Recognition
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribeDoc = onSnapshot(doc(db, 'interviews', id), (docSnap) => {
      if (docSnap.exists()) {
        setInterview({ id: docSnap.id, ...docSnap.data() } as MockInterview);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `interviews/${id}`);
    });

    const messagesRef = collection(db, 'interviews', id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(m => ({ id: m.id, ...m.data() } as InterviewMessage));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `interviews/${id}/messages`);
    });

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        setInterimText('');
        // Sync base reference directly from the synchronous ref to prevent React state update races
        baseTextRef.current = currentFinalTextRef.current;
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';
        
        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const trimmed = transcript.trim();
            if (trimmed) {
              finalTrans += (finalTrans ? ' ' : '') + trimmed;
            }
          } else {
            const trimmed = transcript.trim();
            if (trimmed) {
              interimTrans += (interimTrans ? ' ' : '') + trimmed;
            }
          }
        }
        
        // Merge base state with new final session transcript to guarantee zero duplicate words/repeats
        const combined = mergeSpeechTranscripts(baseTextRef.current, finalTrans);
        currentFinalTextRef.current = combined;
        setInputText(combined);
        setInterimText(interimTrans);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions in your browser. (Also check your system/OS settings).');
          shouldBeRecordingRef.current = false;
          setIsRecording(false);
        } else if (event.error === 'aborted') {
          console.log("Speech recognition aborted.");
        } else if (event.error === 'no-speech') {
          console.log("No speech detected.");
        } else {
          console.warn(`Speech recognition failed: ${event.error}.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
        
        // Sync base text reference to the synchronous final text from this session
        baseTextRef.current = currentFinalTextRef.current;
        setInputText(currentFinalTextRef.current);

        // Auto-restart with a 400ms delay to give browser media elements time to cleanly release/reacquire to avoid lockups
        if (shouldBeRecordingRef.current) {
          setTimeout(() => {
            if (shouldBeRecordingRef.current) {
              try {
                recognition.start();
              } catch (e) {
                console.warn("Speech recognition auto-restart failed:", e);
              }
            }
          }, 400);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      unsubscribeDoc();
      unsubscribeMessages();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try {
          recognitionRef.current.stop();
        } catch(e) {}
      }
    };
  }, [id]);

  useEffect(() => {
    if (interview && messages.length === 0 && !isProcessing && interview.status === 'active') {
      startFirstQuestion(doc(db, 'interviews', id!), interview);
    }
  }, [interview, messages, isProcessing, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Text to Speech for the latest AI message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'ai' && isTTSActive && !isProcessing) {
      speak(lastMessage.text);
    }
  }, [messages, isTTSActive, isProcessing]);

  const startFirstQuestion = async (intRef: any, currentInterview: MockInterview) => {
    setIsProcessing(true);
    const firstQuestion = await aiService.generateInterviewQuestion(
      currentInterview.role, 
      currentInterview.company, 
      currentInterview.difficulty, 
      [],
      currentInterview.focusAreas
    );
    try {
      await addDoc(collection(intRef, 'messages'), {
        role: 'ai',
        text: firstQuestion,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `interviews/${id}/messages`);
    }
    setIsProcessing(false);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const currentDisplayedText = isRecording && interimText 
    ? (inputText + (inputText ? ' ' : '') + interimText) 
    : inputText;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = currentDisplayedText.trim();
    if (!messageText || isProcessing) return;

    if (isRecording) {
      shouldBeRecordingRef.current = false;
      recognitionRef.current?.stop();
    }
    
    // Stop any ongoing speech immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setInputText('');
    baseTextRef.current = '';
    currentFinalTextRef.current = '';
    setInterimText('');
    setIsProcessing(true);

    // Save user message
    try {
      await addDoc(collection(db, 'interviews', id!, 'messages'), {
        role: 'user',
        text: messageText,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `interviews/${id}/messages`);
    }

    // Generate AI response
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    history.push({ role: 'user', text: messageText });

    const nextQuestion = await aiService.generateInterviewQuestion(
      interview!.role, 
      interview!.company, 
      interview!.difficulty, 
      history,
      interview!.focusAreas
    );
    
    try {
      await addDoc(collection(db, 'interviews', id!, 'messages'), {
        role: 'ai',
        text: nextQuestion,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `interviews/${id}/messages`);
    }

    setIsProcessing(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      shouldBeRecordingRef.current = false;
      recognitionRef.current?.stop();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      shouldBeRecordingRef.current = true;
      baseTextRef.current = inputTextRef.current; // Anchor transcript to current text
      currentFinalTextRef.current = inputTextRef.current;
      setInterimText('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
      }
    }
  };

  const finishInterview = async () => {
    if (messages.length < 2) {
      alert("Please provide at least one response before finishing.");
      return;
    }
    
    // Stop any ongoing speech immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsFinishing(true);
    
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const analysis = await aiService.analyzeInterview(interview!.role, history);

      if (id && authUser) {
        // Update session status FIRST
        const interviewRef = doc(db, 'interviews', id);
        try {
          await updateDoc(interviewRef, {
            status: 'completed',
            feedback: analysis,
            completedAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Error updating interview status:", e);
          handleFirestoreError(e, OperationType.UPDATE, `interviews/${id}`);
        }

        // Fetch latest profile to ensure accuracy for average calculation
        const userRef = doc(db, 'users', authUser.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userRef);
        } catch (e) {
          console.error("Error fetching user profile for stats:", e);
          handleFirestoreError(e, OperationType.GET, `users/${authUser.uid}`);
          throw e;
        }
        
        let currentTotal = 0;
        let currentAvg = 0;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          currentTotal = userData.stats?.totalInterviews || 0;
          currentAvg = userData.stats?.avgScore || 0;
        }

        const score = typeof analysis.overallScore === 'number' ? analysis.overallScore : 0;
        const newTotal = currentTotal + 1;
        const newAvg = Math.round(((currentAvg * currentTotal) + score) / newTotal);

        try {
          await updateDoc(userRef, {
            'stats.totalInterviews': increment(1),
            'stats.avgScore': newAvg 
          });
        } catch (e) {
          console.error("Error updating user stats:", e);
          handleFirestoreError(e, OperationType.UPDATE, `users/${authUser.uid}`);
        }

        // Brief delay to allow snapshots to propagate before navigation
        setTimeout(() => {
          navigate('/analytics');
        }, 800);
      } else {
        navigate('/analytics');
      }
    } catch (error) {
      console.error("Error finishing interview:", error);
      alert("There was an issue analyzing your session. Returning to analytics.");
      navigate('/analytics');
    } finally {
      setIsFinishing(false);
    }
  };

  if (!interview) return null;

  return (
    <div className="flex-1 h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 lg:py-4 flex flex-col gap-3 lg:gap-4 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden min-h-0">
      {isFinishing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0B10]/95 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-black text-white tracking-widest uppercase text-center px-4">Analyzing Performance</h2>
          <p className="text-slate-400 mt-2 font-medium text-center px-4">Leo is preparing your feedback report...</p>
        </div>
      )}

      {/* Mobile Header Tabs */}
      <div className="flex lg:hidden gap-1 p-1 bg-white/5 rounded-2xl shrink-0">
        {[
          { id: 'info', icon: Bot, label: 'Leo' },
          { id: 'chat', icon: Send, label: 'Interview' },
          { id: 'analytics', icon: TrendingUp, label: 'Analytics' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'chat' ? setShowMobileSidebar(null) : setShowMobileSidebar(tab.id as any)}
            className={cn(
              "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
              (tab.id === 'chat' && !showMobileSidebar) || showMobileSidebar === tab.id
                ? "bg-teal-500 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 min-h-0 overflow-hidden">
        {/* Left Sidebar: The AI Persona */}
        <aside className={cn(
          "lg:w-64 flex-col gap-3 lg:gap-4 transition-all duration-500 shrink-0 flex-1 lg:flex-none min-h-0",
          showMobileSidebar === 'info' ? "flex animate-in fade-in slide-in-from-left-4" : "hidden lg:flex"
        )}>
          {/* AI Avatar Card */}
          <div className="glass-card p-4 lg:p-5 flex flex-col items-center justify-center relative overflow-hidden border-white/10 ring-1 ring-teal-500/10 shrink-0">
            <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mb-4">
              <AnimatePresence>
                {isAISpeaking && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0, 0.4, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-teal-500/20 blur-xl"
                  />
                )}
              </AnimatePresence>

              <div className={cn(
                "relative w-16 h-16 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center transition-all duration-700 z-10",
                isAISpeaking ? "scale-105 border-teal-500/50 shadow-[0_0_30px_rgba(45,212,191,0.3)]" : "scale-100 shadow-xl"
              )}>
                <Bot className={cn("w-7 h-7 text-white transition-all duration-500", isAISpeaking ? "text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" : "opacity-40")} />
              </div>
            </div>
            
            <div className="text-center space-y-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Assistant</span>
              <h3 className="text-base font-black text-white uppercase tracking-wider text-safe">Leo</h3>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", isAISpeaking ? "bg-teal-500 animate-pulse" : "bg-slate-700")} />
                <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isAISpeaking ? "text-teal-400" : "text-slate-600")}>
                  {isAISpeaking ? 'Speaking...' : 'Listening'}
                </p>
              </div>
            </div>
          </div>

          {/* Goal Metrics (Compact) */}
          <div className="glass-card p-5 lg:p-6 border-white/10 flex-1 flex flex-col gap-4 lg:gap-6 ring-1 ring-white/5 overflow-hidden min-h-0">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0">Progress Goals</h4>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-5 lg:space-y-6">
                {[
                  { title: 'Technical Proficiency', detail: 'Knowledge & Concepts', done: messages.length > 2 },
                  { title: 'Communication Clear', detail: 'Clarity & Structure', done: messages.length > 4 },
                  { title: 'Logic & Reasoning', detail: 'Problem Solving', done: messages.length > 6 }
                ].map((goal, i) => (
                  <div key={`goal-${i}`} className="group relative">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-500 mt-0.5",
                        goal.done ? "bg-teal-500/20 border-teal-500 shadow-[0_0_15px_rgba(45,212,191,0.2)]" : "bg-white/5 border-white/5"
                      )}>
                        {goal.done && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                      <div className="space-y-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-wider block transition-colors", goal.done ? "text-slate-100" : "text-slate-500")}>
                          {goal.title}
                        </span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">
                          {goal.detail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-4 lg:pt-6 border-t border-white/5 text-center shrink-0">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block mb-2">Round Analysis</span>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={`dot-${i}`} className={cn("w-3 h-1 rounded-full bg-white/10", i < Math.floor(messages.length / 2) && "bg-teal-500")} />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Central Chat */}
        <main className={cn(
          "flex-1 flex-col min-w-0 min-h-0 transition-all duration-500 bg-[#0A0B10]/20 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl",
          showMobileSidebar ? "hidden lg:flex" : "flex"
        )}>
          {/* Header Navigation */}
          <header className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-colors duration-500",
                isRecording ? "bg-red-500/10 border-red-500/20" : "bg-teal-500/10 border-teal-500/20"
              )}>
                {isRecording ? <Mic className="w-5 h-5 text-red-400 animate-pulse" /> : <Code className="w-5 h-5 text-teal-400" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  {isProcessing ? (
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest animate-pulse shrink-0">Processing...</span>
                  ) : isRecording ? (
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest animate-pulse shrink-0">Listening...</span>
                  ) : (
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest shrink-0">Ready</span>
                  )}
                  <div className="h-0.5 flex-1 bg-white/5 rounded-full min-w-[20px] hidden sm:block" />
                </div>
                <h2 className="text-sm lg:text-base font-black text-white uppercase tracking-widest truncate">
                  {interview.role} <span className="text-slate-500 text-xs font-bold lowercase ml-2">@ {interview.company}</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{interview.difficulty}</span>
              </div>
              <button
                onClick={() => setIsTTSActive(!isTTSActive)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all duration-500",
                  isTTSActive ? "bg-teal-600/10 border-teal-500/20 text-teal-400" : "bg-white/5 border-white/10 text-slate-500"
                )}
              >
                {isTTSActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 lg:py-10 space-y-10 scrollbar-hide bg-gradient-to-b from-[#0A0B10]/50 to-[#0A0B10]/0">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id || `msg-${idx}`}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className={cn("flex w-full gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-xl",
                    msg.role === 'user' ? "bg-slate-800" : "bg-teal-500/10"
                  )}>
                    {msg.role === 'ai' ? <Bot className="w-5 h-5 text-teal-400" /> : <User className="w-5 h-5 text-slate-200" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] lg:max-w-[70%] p-6 rounded-[2rem] text-sm leading-relaxed relative shadow-2xl transition-all hover:scale-[1.01]",
                    msg.role === 'user' 
                      ? "bg-teal-600/15 border border-teal-500/30 text-white rounded-tr-none" 
                      : "bg-white/[0.03] text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-sm"
                  )}>
                    <div className="markdown-body prose prose-invert max-w-none prose-sm font-medium">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <motion.div 
                  key="processing-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-row gap-4 items-center"
                >
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/5 border border-white/5 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                  </div>
                  <div className="bg-white/[0.03] px-6 py-4 rounded-3xl border border-white/5 flex gap-1.5">
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div key="messages-end-anchor" ref={messagesEndRef} />
            </AnimatePresence>
          </div>

          {/* Controls Footer */}
          <footer className="p-3 lg:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center gap-3 lg:gap-4 shrink-0">
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 order-2 sm:order-1">
              <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 group relative overflow-hidden",
                  isRecording 
                    ? "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" 
                    : "bg-teal-600 border-teal-500 text-white hover:bg-teal-500 hover:shadow-[0_0_15px_rgba(13,148,136,0.3)] shadow-2xl"
                )}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isRecording && (
                   <span className="absolute inset-0 rounded-2xl animate-ping opacity-25 bg-red-400"></span>
                )}
                {isRecording ? <MicOff className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" /> : <Mic className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" />}
              </button>

              {/* Mobile-only Finish Button */}
              <button
                onClick={finishInterview}
                disabled={isFinishing}
                className="flex-1 sm:hidden h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg text-safe flex items-center justify-center"
              >
                Finish Session
              </button>
            </div>

            <form onSubmit={handleSend} className="w-full sm:flex-1 relative group order-1 sm:order-2">
              {isRecording && (
                <div id="recording-live-indicator" className="absolute -top-7 left-4 flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest z-10 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                  <span>Listening</span>
                  
                  {/* Liquid Real-Time Audio Waves Visualizer */}
                  <div className="flex items-end gap-0.5 h-3 ml-1 mr-2 opacity-80 shrink-0">
                    <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} className="w-0.5 bg-teal-400 rounded-full" />
                    <motion.div animate={{ height: [8, 4, 8] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} className="w-0.5 bg-teal-400 rounded-full" />
                    <motion.div animate={{ height: [4, 10, 4] }} transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.25 }} className="w-0.5 bg-teal-400 rounded-full" />
                    <motion.div animate={{ height: [6, 12, 6] }} transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} className="w-0.5 bg-teal-400 rounded-full" />
                    <motion.div animate={{ height: [3, 8, 3] }} transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-0.5 bg-teal-400 rounded-full" />
                  </div>
                  {interimText && (
                    <span className="text-slate-500 normal-case font-normal font-sans text-[9px] truncate max-w-[150px] lg:max-w-[280px]">
                      &ldquo;{interimText}&rdquo;
                    </span>
                  )}
                </div>
              )}
              <input
                id="interview-input-field"
                type="text"
                value={currentDisplayedText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  baseTextRef.current = e.target.value;
                  currentFinalTextRef.current = e.target.value;
                  setInterimText('');
                  if (isRecording) {
                    shouldBeRecordingRef.current = false;
                    recognitionRef.current?.stop();
                  }
                }}
                placeholder={isRecording ? "Listening to your response..." : "Type your strategic response..."}
                className={cn(
                  "w-full bg-white/[0.03] border border-white/10 rounded-2xl lg:rounded-3xl px-6 py-4 lg:px-8 lg:py-5 text-sm font-medium focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] transition-all text-white placeholder:text-slate-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest pr-12 lg:pr-24",
                  isRecording && "border-teal-500/30 bg-teal-500/[0.01]"
                )}
              />
              <button
                type="submit"
                disabled={!currentDisplayedText.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 lg:p-4 bg-white text-black rounded-xl lg:rounded-2xl hover:bg-teal-400 hover:text-white transition-all active:scale-95 disabled:opacity-0 shadow-xl"
              >
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </form>

            {/* Desktop-only Finish Button */}
            <button
              onClick={finishInterview}
              disabled={isFinishing}
              className="hidden sm:block px-8 py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg text-safe order-3"
            >
              Finish Session
            </button>
          </footer>
        </main>

        {/* Right Sidebar: Real-time Analysis */}
        <aside className={cn(
          "lg:w-72 flex-col gap-3 lg:gap-4 transition-all duration-500 shrink-0 flex-1 lg:flex-none min-h-0",
          showMobileSidebar === 'analytics' ? "flex animate-in fade-in slide-in-from-right-4" : "hidden lg:flex"
        )}>
          {/* Signal Cards */}
          <div className="glass-card p-4 lg:p-5 border-white/10 relative overflow-hidden ring-1 ring-white/5 flex flex-col gap-4 shrink-0">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-safe">Performance Signals</h4>
            <div className="space-y-4">
              {[
                { label: 'Signal Coherence', value: 'High', color: 'teal', width: '92%' },
                { label: 'Voice Confidence', value: 'Optimal', color: 'emerald', width: '85%' },
                { label: 'Technical Depth', value: 'Elevated', color: 'purple', width: '78%' }
              ].map((signal, i) => (
                <div key={`signal-${i}`} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{signal.label}</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", `text-${signal.color}-400`)}>{signal.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: signal.width }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn("h-full rounded-full shadow-lg", {
                        'bg-teal-500 shadow-teal-500/40': signal.color === 'teal',
                        'bg-emerald-500 shadow-emerald-500/40': signal.color === 'emerald',
                        'bg-purple-500 shadow-purple-500/40': signal.color === 'purple'
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Log */}
          <div className="glass-card p-6 lg:p-8 border-white/10 bg-teal-500/[0.02] flex-1 flex flex-col ring-1 ring-white/5 overflow-hidden min-h-0">
            <div className="flex items-center gap-3 mb-6 shrink-0 text-safe">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
              <h4 className="text-[10px] font-black text-teal-300 uppercase tracking-widest">Live Dynamic Analysis</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-6">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:bg-white/10 transition-colors cursor-default">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Ongoing Focus</span>
                  <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic underline underline-offset-4 decoration-teal-500/30">
                    Leo is evaluating your ability to articulate <span className="text-teal-400">complex architecture decisions</span> clearly...
                  </p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Key Terms Detected</span>
                    <Code className="w-3 h-3 text-slate-700" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Scalability', 'Observability', 'Refactor'].map(k => (
                      <span key={k} className="px-2.5 py-1 bg-teal-500/5 text-teal-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-500/20">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 group shrink-0">
              <button
                onClick={finishInterview}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 group-hover:border-teal-500/30"
              >
                <Target className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Target Evaluation</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

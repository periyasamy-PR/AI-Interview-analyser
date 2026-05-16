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
  const latestInterimRef = useRef('');

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
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        latestInterimRef.current = '';
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        
        if (finalTrans) {
          setInputText(prev => (prev + (prev ? ' ' : '') + finalTrans).trim());
        }
        setInterimText(interimTrans);
        latestInterimRef.current = interimTrans;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions in your browser. (Also check your system/OS settings).');
        } else if (event.error !== 'no-speech') {
          // If it's a network, audio-capture, or unrecognized error, alert the user so they know it's a browser/OS issue.
          alert(`Speech recognition failed: ${event.error}. Please ensure you are using Google Chrome, check your microphone settings, and ensure your internet connection doesn't block Google's speech services.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
        if (latestInterimRef.current) {
          setInputText(prev => (prev + (prev ? ' ' : '') + latestInterimRef.current).trim());
        }
        latestInterimRef.current = '';
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
        recognitionRef.current.stop();
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
      recognitionRef.current?.stop();
    }
    
    // Stop any ongoing speech immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setInputText('');
    setInterimText('');
    latestInterimRef.current = '';
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
      recognitionRef.current?.stop();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden min-h-0">
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

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
        {/* Left Sidebar: The AI Persona */}
        <aside className={cn(
          "lg:w-64 flex-col gap-4 lg:gap-6 transition-all duration-500 shrink-0 flex-1 lg:flex-none",
          showMobileSidebar === 'info' ? "flex animate-in fade-in slide-in-from-left-4" : "hidden lg:flex"
        )}>
          {/* AI Avatar Card */}
          <div className="glass-card p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden border-white/10 ring-1 ring-teal-500/10 shrink-0">
            <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center mb-6">
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
                "relative w-24 h-24 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center transition-all duration-700 z-10",
                isAISpeaking ? "scale-110 border-teal-500/50 shadow-[0_0_40px_rgba(45,212,191,0.3)]" : "scale-100 shadow-xl"
              )}>
                <Bot className={cn("w-10 h-10 text-white transition-all duration-500", isAISpeaking ? "text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" : "opacity-40")} />
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Assistant</span>
              <h3 className="text-lg font-black text-white uppercase tracking-wider text-safe">Leo</h3>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", isAISpeaking ? "bg-teal-500 animate-pulse" : "bg-slate-700")} />
                <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isAISpeaking ? "text-teal-400" : "text-slate-600")}>
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
          "flex-1 flex-col min-w-0 transition-all duration-500 bg-[#0A0B10]/20 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl",
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
          <footer className="p-4 lg:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="flex w-full sm:w-auto gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl shrink-0 group relative overflow-hidden",
                  isRecording 
                    ? "bg-red-500 border-red-400 text-white" 
                    : "bg-teal-600 border-teal-500 text-white hover:bg-teal-500"
                )}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isRecording && (
                   <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-white"></span>
                )}
                {isRecording ? <MicOff className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" /> : <Mic className="w-6 h-6 lg:w-7 lg:h-7 relative z-10" />}
              </button>
            </div>

            <form onSubmit={handleSend} className="flex-1 w-full relative group">
              <input
                type="text"
                value={currentDisplayedText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setInterimText('');
                  latestInterimRef.current = '';
                  if (isRecording) {
                    recognitionRef.current?.stop();
                  }
                }}
                placeholder="Type your strategic response..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl lg:rounded-3xl px-8 py-4 lg:py-5 text-sm font-medium focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] transition-all text-white placeholder:text-slate-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest pr-12 lg:pr-24"
              />
              <button
                type="submit"
                disabled={!currentDisplayedText.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 lg:p-4 bg-white text-black rounded-xl lg:rounded-2xl hover:bg-teal-400 hover:text-white transition-all active:scale-95 disabled:opacity-0 shadow-xl"
              >
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </form>

            <button
              onClick={finishInterview}
              disabled={isFinishing}
              className="hidden sm:block px-8 py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg text-safe"
            >
              Finish Session
            </button>
          </footer>
        </main>

        {/* Right Sidebar: Real-time Analysis */}
        <aside className={cn(
          "lg:w-72 flex-col gap-4 lg:gap-6 transition-all duration-500 shrink-0 flex-1 lg:flex-none",
          showMobileSidebar === 'analytics' ? "flex animate-in fade-in slide-in-from-right-4" : "hidden lg:flex"
        )}>
          {/* Signal Cards */}
          <div className="glass-card p-6 lg:p-8 border-white/10 relative overflow-hidden ring-1 ring-white/5 flex flex-col gap-8 shrink-0">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-safe">Performance Signals</h4>
            <div className="space-y-8">
              {[
                { label: 'Signal Coherence', value: 'High', color: 'teal', width: '92%' },
                { label: 'Voice Confidence', value: 'Optimal', color: 'emerald', width: '85%' },
                { label: 'Technical Depth', value: 'Elevated', color: 'purple', width: '78%' }
              ].map((signal, i) => (
                <div key={`signal-${i}`} className="space-y-3">
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

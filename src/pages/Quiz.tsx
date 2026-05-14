import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Brain, Target, ArrowRight, Loader2, Award } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Quiz() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Mid');
  const [quizData, setQuizData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: setup, 1: quiz, 2: results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = ['Frontend', 'Backend', 'Full Stack', 'System Design', 'Data Structures', 'Algorithms'];

  const startQuiz = async () => {
    if (!category) return;
    setIsProcessing(true);
    const data = await aiService.generateQuiz(category, difficulty);
    setQuizData(data);
    setCurrentStep(1);
    setIsProcessing(false);
  };

  const handleNext = async () => {
    if (selectedOption === quizData.questions[currentQuestion].correctAnswer) {
      setScore(s => s + 1);
    }

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      setSelectedOption(null);
    } else {
      // Finish
      setCurrentStep(2);
      await saveResult();
    }
  };

  const saveResult = async () => {
    if (!user) return;
    const finalScore = selectedOption === quizData.questions[currentQuestion].correctAnswer ? score + 1 : score;
    try {
      await addDoc(collection(db, 'quizzes'), {
        userId: user.uid,
        category,
        score: finalScore,
        total: quizData.questions.length,
        timestamp: serverTimestamp()
      });
      // Update user stats
      await updateDoc(doc(db, 'users', user.uid), {
        'stats.completedQuizzes': increment(1)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'quizzes');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto py-12">
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="glass-card p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden border-white/10"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 animate-pulse" />
            <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(45,212,191,0.4)] text-white">
              <Brain className="w-10 h-10" />
            </div>
            <h2 className="text-5xl font-display font-black text-white mb-4 tracking-tighter uppercase leading-none text-safe">
              Knowledge <br />
              <span className="text-teal-400 text-glow-teal">Assessment.</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-12 text-safe">Select your domain and test your knowledge</p>

            <div className="space-y-12">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Select Assessment Domain</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "px-6 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all duration-300",
                        category === c 
                          ? "bg-teal-600 border-teal-500 text-white shadow-[0_0_20px_rgba(45,212,191,0.3)] scale-95" 
                          : "glass-card border-white/10 text-slate-500 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Difficulty Level</label>
                <div className="flex gap-4">
                  {['Entry', 'Mid', 'Senior'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "flex-1 px-6 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all duration-300",
                        difficulty === d 
                          ? "bg-white/10 border-white/20 text-white shadow-xl" 
                          : "glass-card border-white/10 text-slate-600 hover:text-slate-400"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startQuiz}
                disabled={!category || isProcessing}
                className="group relative w-full px-10 py-6 rounded-[2rem] bg-teal-600 text-white text-sm font-black uppercase tracking-widest overflow-hidden transition-all shadow-[0_0_50px_rgba(45,212,191,0.3)] hover:shadow-[0_0_80px_rgba(45,212,191,0.5)] active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Assessment <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" /></>}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 1 && quizData && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden"
          >
            <div className="h-1.5 bg-white/5">
              <motion.div 
                className="h-full bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.8)]" 
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            </div>
            <div className="p-16">
              <div className="flex justify-between items-center mb-12">
                <span className="text-xs font-black text-teal-400 uppercase tracking-widest">Question {currentQuestion + 1} of {quizData.questions.length}</span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{category} • {difficulty}</span>
              </div>

              <h3 className="text-3xl font-display font-black text-white mb-16 leading-[1.2] tracking-tight uppercase text-safe">
                {quizData.questions[currentQuestion].question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {quizData.questions[currentQuestion].options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={cn(
                      "w-full p-8 rounded-3xl border text-left transition-all flex items-center justify-between group relative overflow-hidden",
                      selectedOption === idx 
                        ? "bg-white/[0.08] border-teal-500/50 text-white shadow-2xl" 
                        : "glass-card border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    )}
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-black uppercase tracking-wider pr-10">{option}</span>
                    <div className={cn(
                      "w-6 h-6 rounded-xl border flex items-center justify-center transition-all shrink-0",
                      selectedOption === idx ? "bg-teal-600 border-teal-400" : "border-slate-800 group-hover:border-slate-600"
                    )}>
                      {selectedOption === idx && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className="w-full mt-16 px-10 py-6 bg-white text-black rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-30 hover:bg-slate-100"
              >
                {currentQuestion === quizData.questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center glass-card p-20 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-10 mx-auto text-purple-400 border border-white/10 shadow-2xl">
              <Award className="w-12 h-12" />
            </div>
            <h2 className="text-5xl font-display font-black text-white mb-2 uppercase tracking-tighter">Analysis Complete.</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-12">Performance analysis computed</p>

            <div className="flex justify-center items-baseline space-x-4 mb-16">
              <span className="text-9xl font-display font-black text-white tracking-tighter leading-none">{score}</span>
              <span className="text-2xl font-black text-slate-700">/ {quizData.questions.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-16">
              <div className="p-8 glass-card border-white/10 bg-white/[0.01]">
                <p className="text-xs text-slate-600 uppercase font-black tracking-widest mb-2">Accuracy</p>
                <p className="text-3xl font-display font-black text-white">{(score / quizData.questions.length) * 100}%</p>
              </div>
              <div className="p-8 glass-card border-white/10 bg-white/[0.01]">
                <p className="text-xs text-slate-600 uppercase font-black tracking-widest mb-2">Rank</p>
                <p className="text-3xl font-display font-black text-emerald-400">{score > (quizData.questions.length / 2) ? 'EXPERT' : 'STABLE'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentStep(0);
                setCurrentQuestion(0);
                setScore(0);
                setSelectedOption(null);
              }}
              className="w-full px-10 py-6 bg-teal-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-[0_0_40px_rgba(45,212,191,0.3)] transition-all hover:bg-teal-500 active:scale-95"
            >
              Take Another Quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

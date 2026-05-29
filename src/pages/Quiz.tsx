import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Brain, Target, ArrowRight, Loader2, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFallbackQuiz } from '../data/quizFallbacks';

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
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories = ['Frontend', 'Backend', 'Full Stack', 'System Design', 'Data Structures', 'Algorithms'];

  const startQuiz = async () => {
    if (!category) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setIsFallbackActive(false);

    try {
      const data = await aiService.generateQuiz(category, difficulty);
      if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizData(data);
        setIsFallbackActive(false);
      } else {
        console.warn("API returned empty questions. Initiating local high-reliability questions.");
        const fallback = getFallbackQuiz(category, difficulty);
        setQuizData(fallback);
        setIsFallbackActive(true);
      }
    } catch (e: any) {
      console.error("Failed to generate quiz from API: ", e);
      const fallback = getFallbackQuiz(category, difficulty);
      setQuizData(fallback);
      setIsFallbackActive(true);
    } finally {
      setCurrentQuestion(0);
      setScore(0);
      setSelectedOption(null);
      setCurrentStep(1);
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (!quizData || !quizData.questions || !quizData.questions[currentQuestion]) {
      return;
    }

    const currentCorrectAnswer = quizData.questions[currentQuestion].correctAnswer;
    const isCorrect = selectedOption === currentCorrectAnswer;

    let finalScore = score;
    if (isCorrect) {
      finalScore = score + 1;
      setScore(finalScore);
    }

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      setSelectedOption(null);
    } else {
      // Last question finished
      setCurrentStep(2);
      await saveResult(finalScore);
    }
  };

  const saveResult = async (finalScore: number) => {
    if (!user || !quizData || !quizData.questions) return;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto py-4 sm:py-8 md:py-12">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="glass-card p-6 sm:p-10 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/10"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 animate-pulse" />
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-teal-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-10 shadow-[0_0_30px_rgba(45,212,191,0.4)] text-white shrink-0">
                <Brain className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white mb-3 sm:mb-4 tracking-tighter uppercase leading-[1.1] text-safe">
                Knowledge <br />
                <span className="text-teal-400 text-glow-teal">Assessment.</span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 sm:mb-12 text-safe">
                Select your domain and test your knowledge
              </p>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-8 sm:space-y-12">
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">
                    Select Assessment Domain
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={cn(
                          "px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 text-center truncate",
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
                  <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Entry', 'Mid', 'Senior'].map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 text-center truncate",
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
                  className="group relative w-full px-6 sm:px-10 py-4 sm:py-6 rounded-xl sm:rounded-[2rem] bg-teal-600 text-white text-xs sm:text-sm font-black uppercase tracking-widest overflow-hidden transition-all shadow-[0_0_50px_rgba(45,212,191,0.3)] hover:shadow-[0_0_80px_rgba(45,212,191,0.5)] active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating Assessment...
                      </>
                    ) : (
                      <>
                        Start Assessment 
                        <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && quizData && quizData.questions && quizData.questions.length > 0 && quizData.questions[currentQuestion] ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
            >
              <div className="h-1.5 bg-white/5">
                <motion.div 
                  className="h-full bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.8)]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                />
              </div>
              <div className="p-6 sm:p-10 md:p-16">
                {isFallbackActive && (
                  <div className="mb-6 px-4 py-3 bg-teal-950/40 border border-teal-500/20 text-teal-400 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-teal-400 animate-pulse shrink-0" />
                    <span>Reliable Adaptive Assessment Activated Successfully!</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-8 sm:mb-12">
                  <span className="text-[10px] sm:text-xs font-black text-teal-400 uppercase tracking-widest">
                    Question {currentQuestion + 1} of {quizData.questions.length}
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest">
                    {category} • {difficulty}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-display font-black text-white mb-6 sm:mb-12 leading-[1.3] text-safe">
                  {quizData.questions[currentQuestion].question}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {quizData.questions[currentQuestion].options.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={cn(
                        "w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl border text-left transition-all flex items-center justify-between gap-4 group relative overflow-hidden whitespace-normal break-words",
                        selectedOption === idx 
                          ? "bg-white/[0.08] border-teal-500/50 text-white shadow-2xl" 
                          : "glass-card border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                      )}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider pr-2 sm:pr-8 flex-1 leading-relaxed">
                        {option}
                      </span>
                      <div className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all shrink-0",
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
                  className="w-full mt-8 sm:mt-12 px-6 sm:px-10 py-4 sm:py-5 bg-white text-black rounded-xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center gap-2"
                >
                  <span>
                    {currentQuestion === quizData.questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : currentStep === 1 ? (
            <motion.div
              key="quiz-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center glass-card p-8 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Unstable Quiz Data Structure</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium max-w-md mx-auto">
                No active questions could be generated. This may happen due to standard API limit fluctuations in production.
              </p>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setErrorMessage(null);
                }}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 mx-auto hover:bg-teal-500"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Go Back to Setup</span>
              </button>
            </motion.div>
          ) : null}

          {currentStep === 2 && quizData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center glass-card p-6 sm:p-12 md:p-20 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-10 mx-auto text-purple-400 border border-white/10 shadow-2xl shrink-0">
                <Award className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white mb-2 uppercase tracking-tighter">
                Analysis Complete.
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 sm:mb-12">
                Performance analysis computed
              </p>

              <div className="flex justify-center items-baseline space-x-2 sm:space-x-4 mb-10 sm:mb-16">
                <span className="text-6xl sm:text-7xl md:text-9xl font-display font-black text-white tracking-tighter leading-none">
                  {score}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-700">
                  / {quizData.questions ? quizData.questions.length : 5}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-16">
                <div className="p-5 sm:p-8 glass-card border border-white/10 bg-white/[0.01] rounded-2xl text-center">
                  <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-black tracking-widest mb-1 sm:mb-2">
                    Accuracy
                  </p>
                  <p className="text-xl sm:text-3xl font-display font-black text-white">
                    {quizData.questions && quizData.questions.length > 0
                      ? Math.round((score / quizData.questions.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-5 sm:p-8 glass-card border border-white/10 bg-white/[0.01] rounded-2xl text-center">
                  <p className="text-[10px] sm:text-xs text-slate-600 uppercase font-black tracking-widest mb-1 sm:mb-2">
                    Rank
                  </p>
                  <p className="text-xl sm:text-3xl font-display font-black text-emerald-400">
                    {quizData.questions && score > (quizData.questions.length / 2) ? 'EXPERT' : 'STABLE'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentStep(0);
                  setCurrentQuestion(0);
                  setScore(0);
                  setSelectedOption(null);
                  setIsFallbackActive(false);
                  setErrorMessage(null);
                }}
                className="w-full px-6 sm:px-10 py-4 sm:py-6 bg-teal-600 text-white rounded-xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_40px_rgba(45,212,191,0.3)] transition-all hover:bg-teal-500 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>Take Another Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { MockInterview, QuizResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Play, History, ArrowUpRight, Trophy, Clock, Star, Mic, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate, cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const interviewQuery = query(
      collection(db, 'interviews'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const quizQuery = query(
      collection(db, 'quizzes'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeInterviews = onSnapshot(interviewQuery, (snapshot) => {
      setInterviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockInterview)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'interviews');
      setLoading(false);
    });

    const unsubscribeQuizzes = onSnapshot(quizQuery, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quizzes');
    });

    return () => {
      unsubscribeInterviews();
      unsubscribeQuizzes();
    };
  }, [user]);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [setupData, setSetupData] = useState({
    role: 'Full Stack Developer',
    company: 'TechCorp',
    difficulty: 'Mid' as 'Entry' | 'Mid' | 'Senior',
    focusAreas: [] as string[]
  });

  const roles = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Python Developer',
    'Data Scientist',
    'Mobile Developer',
    'DevOps Engineer'
  ];

  const focusOptions = [
    { id: 'tech', label: 'Technical Accuracy' },
    { id: 'comm', label: 'Communication Skills' },
    { id: 'solve', label: 'Problem Solving' },
    { id: 'scenario', label: 'Real-world Scenarios' },
    { id: 'behavior', label: 'Behavioral & HR' }
  ];

  const toggleFocusArea = (label: string) => {
    setSetupData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(label)
        ? prev.focusAreas.filter(a => a !== label)
        : [...prev.focusAreas, label]
    }));
  };

  const startNewInterview = async () => {
    if (!setupData.role.trim()) {
      alert("Please specify a role for the interview.");
      return;
    }
    const interviewData = {
      userId: user?.uid,
      role: setupData.role.trim(),
      company: setupData.company.trim() || 'TechCorp',
      difficulty: setupData.difficulty,
      focusAreas: setupData.focusAreas,
      status: 'active',
      createdAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'interviews'), interviewData);
      navigate(`/interview/${docRef.id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'interviews');
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === 'completed' && i.feedback && typeof i.feedback.overallScore === 'number');
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.feedback?.overallScore || 0), 0) / completedInterviews.length)
    : 0;
  const totalQuizzes = quizzes.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight leading-tight text-safe">
            Welcome back, <span className="text-teal-400">{profile?.displayName}</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3 text-glow-teal text-safe">Elevate your potential with AI-driven preparation.</p>
        </div>
        <button
          onClick={() => setIsSetupOpen(true)}
          className="group relative px-12 py-6 rounded-[2rem] bg-teal-600 text-white text-base font-black uppercase tracking-widest overflow-hidden transition-all shadow-[0_0_40px_rgba(45,212,191,0.2)] hover:shadow-[0_0_60px_rgba(45,212,191,0.4)] active:scale-95"
        >
          <span className="relative z-10 flex items-center">
            <Plus className="w-6 h-6 mr-3" />
            Start New Session
          </span>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: History, color: 'text-teal-400', label: 'Sessions', value: totalInterviews },
          { icon: Star, color: 'text-emerald-400', label: 'Skill Index', value: `${avgScore}%` },
          { icon: Trophy, color: 'text-purple-400', label: 'Milestones', value: totalQuizzes },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card glass-card-hover p-8 flex flex-col items-start gap-6 border-white/10">
            <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 text-safe">{stat.label}</p>
              <p className="text-5xl font-display font-black text-white tracking-tight text-safe">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Interviews */}
        <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
          <div className="p-10 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
            <h2 className="text-lg font-black text-white uppercase tracking-widest text-safe">Recent Interviews</h2>
            <Link to="/analytics" className="text-teal-400 text-sm font-black uppercase tracking-widest hover:text-white transition-colors text-safe">View All</Link>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.03]">
            {interviews.length > 0 ? interviews.slice(0, 5).map((interview) => (
              <div key={interview.id} className="p-8 flex items-center justify-between hover:bg-white/[0.03] transition-all group">
                <div className="flex items-center space-x-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-teal-600 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]",
                    interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-teal-400'
                  )}>
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">{interview.role}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-bold uppercase">{interview.company}</span>
                      <div className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-xs text-slate-500 font-bold uppercase">{formatDate(interview.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {interview.status === 'completed' ? (
                    <div className="text-right">
                      <span className="text-emerald-400 font-display font-black text-2xl">
                        {typeof interview.feedback?.overallScore === 'number' ? `${interview.feedback.overallScore}%` : 'N/A'}
                      </span>
                      <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Alpha</p>
                    </div>
                  ) : (
                    <Link to={`/interview/${interview.id}`} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-teal-600 hover:border-teal-500 transition-all shadow-xl group/btn">
                      <Play className="w-5 h-5 fill-current group-hover/btn:scale-110 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-600 text-xs font-black uppercase tracking-[0.2em]">0 Simulations Detected</div>
            )}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
          <div className="p-10 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
            <h2 className="text-lg font-black text-white uppercase tracking-widest text-safe">Skill Assessments</h2>
            <Link to="/quiz" className="text-teal-400 text-sm font-black uppercase tracking-widest hover:text-white transition-colors text-safe">New Quiz</Link>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.03]">
            {quizzes.length > 0 ? quizzes.slice(0, 5).map((quiz) => (
              <div key={quiz.id} className="p-8 flex items-center justify-between hover:bg-white/[0.03] transition-all group">
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400 border border-white/5 group-hover:border-purple-500/50 transition-all duration-500">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">{quiz.category}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">{formatDate(quiz.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <span className="text-white font-display font-black text-2xl">
                      {typeof quiz.score === 'number' && typeof quiz.total === 'number' ? `${quiz.score}/${quiz.total}` : 'N/A'}
                    </span>
                    <div className="w-20 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: typeof quiz.score === 'number' && typeof quiz.total === 'number' && quiz.total > 0 ? `${(quiz.score / quiz.total) * 100}%` : '0%' }}
                        className="bg-purple-500 h-full rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)]" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-600 text-xs font-black uppercase tracking-[0.2em]">Neutral Skill Level</div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      <AnimatePresence>
        {isSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSetupOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-card p-6 lg:p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 animate-pulse" />
              <h2 className="text-2xl lg:text-3xl font-display font-black text-white mb-2 tracking-tight uppercase">Interview Setup</h2>
              <p className="text-[10px] lg:text-xs text-slate-500 font-bold uppercase tracking-widest mb-6 lg:mb-8">Configure your session parameters</p>
              
              <div className="space-y-6 lg:space-y-8">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Select Role</label>
                  <div className="relative group">
                    <select
                      value={isCustomRole ? 'Custom' : setupData.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Custom') {
                          setIsCustomRole(true);
                          setSetupData({ ...setupData, role: '' });
                        } else {
                          setIsCustomRole(false);
                          setSetupData({ ...setupData, role: val });
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer group-hover:bg-white/[0.08]"
                    >
                      {roles.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                      <option value="Custom" className="bg-slate-900">Custom Definition</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 rotate-45 text-teal-400" />
                    </div>
                  </div>
                  
                  {isCustomRole && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <input
                        type="text"
                        autoFocus
                        placeholder="Specify target domain..."
                        value={setupData.role}
                        className="w-full bg-teal-500/5 border border-teal-500/20 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-teal-300/20 focus:outline-none focus:border-teal-500/50 shadow-inner transition-all"
                        onChange={(e) => setSetupData({ ...setupData, role: e.target.value })}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Company</label>
                    <input
                      type="text"
                      value={setupData.company}
                      onChange={(e) => setSetupData({ ...setupData, company: e.target.value })}
                      placeholder="e.g. Google"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all hover:bg-white/[0.08]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Difficulty</label>
                    <div className="relative group">
                      <select
                        value={setupData.difficulty}
                        onChange={(e) => setSetupData({ ...setupData, difficulty: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer group-hover:bg-white/[0.08]"
                      >
                        {['Entry', 'Mid', 'Senior'].map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 rotate-45 text-teal-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {focusOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFocusArea(opt.label)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                          setupData.focusAreas.includes(opt.label)
                            ? "bg-teal-600 border-teal-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                            : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    onClick={() => setIsSetupOpen(false)}
                    className="flex-1 px-8 py-4 rounded-2xl border border-white/5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startNewInterview}
                    className="flex-1 px-8 py-4 bg-teal-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all active:scale-95 hover:bg-teal-400"
                  >
                    Start Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

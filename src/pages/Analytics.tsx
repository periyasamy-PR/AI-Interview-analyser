import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { MockInterview } from '../types';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Mic2, MessageSquare, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'interviews'),
      where('userId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInterviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockInterview)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'interviews');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400">Loading analytics...</div>;

  const chartData = interviews.map((int, idx) => ({
    name: `Int ${idx + 1}`,
    score: int.feedback?.overallScore || 0,
    comm: int.feedback?.communicationScore || 0,
  }));

  const strengths = Array.from(new Set(interviews.flatMap(t => t.feedback?.topStrengths || []))).slice(0, 5);
  const weakAreas = Array.from(new Set(interviews.flatMap(t => t.feedback?.weakAreas || []))).slice(0, 5);

  const pieData = [
    { name: 'Completed', value: interviews.length },
    { name: 'Target Reached', value: interviews.filter(i => (i.feedback?.overallScore || 0) > 80).length },
  ];

  const COLORS = ['#2dd4bf', '#a855f7'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight leading-tight text-safe">
            Performance <span className="text-teal-400 text-glow-teal">Analytics.</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3 text-safe">Detailed breakdown of your growth.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 glass-card flex items-center gap-3 border-white/10 bg-white/[0.01]">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-black text-white uppercase tracking-widest">+12.4% Momentum</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-10 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
            <TrendingUp className="w-48 h-48 text-teal-500" />
          </div>
          <div className="flex items-center justify-between mb-12 relative z-10">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center text-safe">
              Progress Velocity
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Skill Index</span>
            </div>
          </div>
          <div className="h-96 w-full relative z-10 min-w-0 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(3, 4, 8, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#2dd4bf" strokeWidth={5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 font-black uppercase tracking-widest italic text-xs gap-4">
                <BarChart3 className="w-12 h-12 opacity-20" />
                Awaiting Data
              </div>
            )}
          </div>
        </div>

        {/* Insight Breakdown */}
        <div className="space-y-8">
          <div className="glass-card p-10 border-white/10">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-10 text-safe">Performance Vectors</h3>
            <div className="space-y-8">
              {[
                { label: 'Technical Depth', val: '84%', color: 'bg-teal-500' },
                { label: 'Communication', val: '92%', color: 'bg-purple-500' },
                { label: 'Problem Solving', val: '78%', color: 'bg-teal-400' },
              ].map(stat => (
                <div key={stat.label} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-xl font-display font-black text-white">{stat.val}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stat.val }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn("h-full rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]", stat.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-10 border-white/10 bg-teal-600/[0.03] shadow-[0_0_50px_rgba(45,212,191,0.1)] relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-teal-400 text-xs font-black uppercase tracking-widest mb-6">Milestones</h3>
              <p className="text-white font-display font-black text-5xl mb-2 tracking-tighter">{interviews.length}/10</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sessions logged</p>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-10 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((interviews.length / 10) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-teal-500 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.8)]" 
                />
              </div>
            </div>
            <Target className="absolute -bottom-10 -right-10 w-44 h-44 text-teal-500 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        {/* Strengths */}
        <div className="glass-card p-10 border-white/10">
          <h2 className="text-sm font-black text-white mb-10 flex items-center uppercase tracking-widest text-safe">
            <CheckCircle2 className="w-5 h-5 mr-4 text-teal-400" />
            Top Strengths
          </h2>
          <div className="flex flex-wrap gap-3">
            {strengths.length > 0 ? strengths.map(s => (
              <span key={s} className="px-5 py-3 bg-white/5 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest border border-white/10 hover:border-teal-500/30 transition-colors">
                {s}
              </span>
            )) : <span className="text-slate-700 font-black uppercase tracking-widest text-xs">Zero records</span>}
          </div>
        </div>

        {/* Improvements */}
        <div className="glass-card p-10 border-white/10">
          <h2 className="text-sm font-black text-white mb-10 flex items-center uppercase tracking-widest text-safe">
            <AlertCircle className="w-5 h-5 mr-4 text-purple-400" />
            Areas for Growth
          </h2>
          <div className="flex flex-wrap gap-3">
            {weakAreas.length > 0 ? weakAreas.map(w => (
              <span key={w} className="px-5 py-3 bg-white/5 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest border border-white/10 hover:border-purple-500/30 transition-colors">
                {w}
              </span>
            )) : <span className="text-slate-700 font-black uppercase tracking-widest text-xs">No failures</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

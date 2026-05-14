import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Brain, Zap, Target, ArrowRight, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 max-w-7xl mx-auto py-8">
      {/* Background Mesh */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl py-20 sm:py-32 lg:py-48">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full glass-card border-white/10 text-teal-400 text-sm font-black uppercase tracking-widest mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Sparkles className="w-5 h-5" />
              <span>AI-Powered Career Intelligence</span>
            </div>
            <h1 className="text-6xl font-display font-black tracking-[-0.04em] text-white sm:text-8xl mb-8 leading-tight text-safe">
              Master Your Next <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-purple-400 to-white text-glow-teal">Interview with Ease.</span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-slate-300 max-w-3xl mx-auto font-medium text-safe">
              Join thousands of professionals using our AI coach to practice realistic technical scenarios, receive instant deep-dive feedback, and land their dream offers.
            </p>
            <div className="mt-14 flex items-center justify-center gap-x-8">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group relative px-12 py-6 rounded-[2rem] bg-white text-black text-base font-black uppercase tracking-widest overflow-hidden transition-all active:scale-95 shadow-[0_0_40px_rgba(45,212,191,0.2)]"
                >
                  <span className="relative z-10 flex items-center">
                    Launch Dashboard
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                </Link>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-[2rem] bg-teal-600 px-12 py-6 text-base font-black uppercase tracking-widest text-white shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:bg-teal-500 hover:shadow-[0_0_60px_rgba(45,212,191,0.5)] transition-all flex items-center active:scale-95"
                >
                  Get Started Free
                  <ArrowRight className="ml-3 w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-white text-base font-black uppercase tracking-widest hover:text-teal-400 transition-colors"
                >
                Explore Method
              </button>
            </div>
          </motion.div>
        </div>
 
        {/* Feature Grid */}
        <div id="features" className="mt-40 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
          {[
            { title: 'Neural Mockups', desc: 'Real-time contextual simulations for high-stakes roles.', icon: Brain, color: 'text-teal-400' },
            { title: 'Semantic Feedback', desc: 'Advanced delivery and technical confidence analysis.', icon: Zap, color: 'text-purple-400' },
            { title: 'Modular Hubs', desc: 'Focused technical assessments across 50+ stacks.', icon: Target, color: 'text-teal-400' },
            { title: 'Live Velocity', desc: 'Real-time calibration of your career progression curve.', icon: BarChart3, color: 'text-purple-400' },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="p-10 glass-card glass-card-hover group flex flex-col items-start"
            >
              <div className={cn(
                "w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-10 shadow-inner group-hover:text-white transition-all duration-500",
                feature.color === 'text-teal-400' ? "group-hover:bg-teal-600 group-hover:border-teal-500" : "group-hover:bg-purple-600 group-hover:border-purple-500"
              )}>
                <feature.icon className={cn("w-6 h-6 transition-colors", feature.color, "group-hover:text-white")} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 text-safe">{feature.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed group-hover:text-slate-400 transition-colors text-safe">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

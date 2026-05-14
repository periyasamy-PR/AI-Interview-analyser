import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Mic, BookOpen, BarChart3, LogOut, User as UserIcon, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Quiz', path: '/quiz', icon: BookOpen },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <nav className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-3 group z-50">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-purple-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.4)]"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-2xl font-display font-black tracking-tighter text-white">
              INTERV<span className="text-teal-400">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user && navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative group ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-teal-400'} transition-colors`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4 md:space-x-6 z-50">
            {user ? (
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className="hidden xl:flex items-center gap-2 bg-teal-500/5 px-4 py-2 rounded-full border border-teal-500/10">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                  <span className="text-xs font-black uppercase tracking-widest text-teal-300">System Online</span>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="relative">
                    <img src={user.photoURL || ''} alt="" className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-white/10 group-hover:border-teal-500/50 transition-colors shadow-xl" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-[#030408] rounded-lg flex items-center justify-center border border-white/10">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-wider">{user.displayName}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Pro Member</span>
                  </div>
                </div>
                
                {/* Mobile Menu Toggle Button */}
                <button 
                  className="md:hidden p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white border border-white/5"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                <button
                  onClick={logout}
                  className="hidden md:block p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-white/5 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-20 left-0 w-full bg-[#0A0B10]/95 backdrop-blur-xl border-b border-white/10 flex flex-col p-4 shadow-2xl"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                    isActive ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 active:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="mt-4 flex items-center space-x-3 px-4 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 active:bg-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

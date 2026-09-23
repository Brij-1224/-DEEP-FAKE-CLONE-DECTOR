import React from 'react';
import { Shield, Radio, FileAudio, Users, Activity, Lock, Camera, Film, FileCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'live' | 'investigation' | 'upload' | 'photo' | 'video' | 'speakers' | 'benchmarks' | 'admin';
  setActiveTab: (tab: 'live' | 'investigation' | 'upload' | 'photo' | 'video' | 'speakers' | 'benchmarks' | 'admin') => void;
  isStreaming: boolean;
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isStreaming,
  wsConnected
}) => {
  const navItems = [
    { id: 'live', label: 'Live Call', icon: Radio, streamingBadge: true },
    { id: 'investigation', label: 'Investigations', icon: FileCheck, isNew: true },
    { id: 'upload', label: 'Audio Lab', icon: FileAudio },
    { id: 'video', label: 'Deepfake Video', icon: Film },
    { id: 'photo', label: 'AI Photo', icon: Camera },
    { id: 'speakers', label: 'Voiceprints', icon: Users },
    { id: 'benchmarks', label: 'Latency', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Lock }
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('live')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:border-cyan-400 transition-colors">
            <Shield className="w-5 h-5" />
            {isStreaming && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-chakra text-lg font-bold tracking-wider text-slate-100">
                TRUTHNET<span className="text-cyan-400">.AI</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono-code font-bold rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                FORENSIC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Voice Clone, Deepfake Video &amp; Extortion Defense
            </p>
          </div>
        </div>

        {/* Full Main Navigation Bar */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {'streamingBadge' in item && item.streamingBadge && isStreaming && (
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                )}

                {'isNew' in item && item.isNew && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono-code font-bold shadow-sm">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Status Indicator */}
        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono-code text-slate-300">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
            <span>{wsConnected ? 'WS STREAM ACTIVE' : 'CONNECTING...'}</span>
          </div>
        </div>

      </div>
    </header>
  );
};

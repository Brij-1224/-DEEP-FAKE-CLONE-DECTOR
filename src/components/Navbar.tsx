import React from 'react';
import { Shield, Radio, Mic, FileAudio, Users, Activity, Lock, Camera } from 'lucide-react';

interface NavbarProps {
  activeTab: 'live' | 'upload' | 'photo' | 'speakers' | 'benchmarks' | 'admin';
  setActiveTab: (tab: 'live' | 'upload' | 'photo' | 'speakers' | 'benchmarks' | 'admin') => void;
  isStreaming: boolean;
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isStreaming,
  wsConnected
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('live')}
          className="flex items-center gap-3 cursor-pointer group select-none"
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
                VERISHIELD<span className="text-cyan-400">.AI</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono-code font-semibold rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                SIH v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-Time Live Call Deepfake &amp; Extortion Defense
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'live'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Live Call</span>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span className="hidden sm:inline">Audio</span> Lab
          </button>

          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'photo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>AI Photo Detector</span>
          </button>

          <button
            onClick={() => setActiveTab('speakers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'speakers'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Voiceprints</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'benchmarks'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">Latency</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/40'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Telemetry Indicator */}
        <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono-code">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
            <span className="text-slate-400">
              {wsConnected ? 'WebSocket 16kHz Stream' : 'HTTP Polling Mode'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};

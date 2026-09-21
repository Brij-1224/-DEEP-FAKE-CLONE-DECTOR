import React, { useState, useEffect } from 'react';
import { Lock, Shield, RefreshCw, Trash2, LogOut, CheckCircle2, AlertTriangle, ShieldAlert, ArrowLeft, Search } from 'lucide-react';
import { AnalysisLogEntry } from '../types';

interface AdminPortalProps {
  onBackToSite: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToSite }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [logs, setLogs] = useState<AnalysisLogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, scamDetected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || { total: 0, highRisk: 0, scamDetected: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch admin logs:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        setIsLoggedIn(true);
        setUsername(data.user?.username || 'admin');
        setPassword('');
      } else {
        setLoginError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setLoginError('Server authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all incident logs?')) return;
    try {
      await fetch('/api/admin/logs', { method: 'DELETE' });
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.callerIdentity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVerdict = 
      verdictFilter === 'ALL' ||
      (verdictFilter === 'HIGH_RISK' && (log.verdict === 'ACTIVE_SCAM_ATTACK' || log.verdict === 'HIGH_RISK_DEEPFAKE')) ||
      (verdictFilter === 'GENUINE' && log.verdict === 'GENUINE_HUMAN');

    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-6">
      
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-chakra text-slate-100">
              VERISHIELD AI — ADMIN MANAGEMENT CONSOLE
            </h2>
            <p className="text-xs text-slate-400">
              Incident logs, model audit trails, and intelligence archive
            </p>
          </div>
        </div>

        <button
          onClick={onBackToSite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live Shield</span>
        </button>
      </div>

      {/* LOGIN VIEW */}
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto py-10">
          <div className="glass-panel p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-chakra text-slate-100">
                🔐 Admin Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorized cyber defense personnel only
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-code text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono-code focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-code text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono-code focus:outline-none focus:border-purple-500"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono-code">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {loading ? 'Verifying...' : 'Log In'}
              </button>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs text-center leading-relaxed">
                Demo credentials — <strong className="text-purple-300 font-mono-code">admin / VeriShield@123</strong><br />
                Configured for SIH evaluator access.
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* DASHBOARD VIEW */
        <div className="space-y-6">
          
          {/* Top Welcome Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-chakra text-slate-100">
                Welcome, <span className="text-purple-400">{username}</span> 👋
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live threat feed &bull; Analysis incident audit history &bull; SIH Telemetry
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-3xl font-bold font-chakra text-slate-100">{stats.total}</div>
              <div className="text-xs font-mono-code uppercase text-slate-400 mt-1">Total Analyses Logged</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-3xl font-bold font-chakra text-red-400">{stats.highRisk}</div>
              <div className="text-xs font-mono-code uppercase text-slate-400 mt-1">High Risk / Deepfakes Flagged</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-3xl font-bold font-chakra text-amber-400">{stats.scamDetected}</div>
              <div className="text-xs font-mono-code uppercase text-slate-400 mt-1">Extortion Scam Signals Detected</div>
            </div>
          </div>

          {/* Incident Log Table Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold font-chakra text-slate-200">
                  📋 Analysis &amp; Interception Log
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search incidents..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-40"
                  />
                </div>

                {/* Filter */}
                <select
                  value={verdictFilter}
                  onChange={(e) => setVerdictFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Verdicts</option>
                  <option value="HIGH_RISK">High Risk Only</option>
                  <option value="GENUINE">Genuine Only</option>
                </select>

                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 text-slate-400 text-xs font-semibold transition-colors cursor-pointer border border-transparent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2.5 font-semibold">#</th>
                    <th className="pb-2.5 font-semibold">TYPE</th>
                    <th className="pb-2.5 font-semibold">TARGET / FILENAME</th>
                    <th className="pb-2.5 font-semibold">VERDICT</th>
                    <th className="pb-2.5 font-semibold">AI RISK</th>
                    <th className="pb-2.5 font-semibold">SCAM CAT</th>
                    <th className="pb-2.5 font-semibold">LATENCY</th>
                    <th className="pb-2.5 font-semibold">TIME (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log, index) => {
                    const isHigh = log.verdict === 'ACTIVE_SCAM_ATTACK' || 
                                   log.verdict === 'HIGH_RISK_DEEPFAKE' || 
                                   log.verdict === 'AI_GENERATED' || 
                                   log.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC';
                    return (
                      <tr key={log.id || index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 text-slate-500">{index + 1}</td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-200">
                          <div className="truncate max-w-[180px]" title={log.filename}>
                            {log.filename}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {log.callerIdentity}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh 
                              ? 'bg-red-950/80 border border-red-800 text-red-300' 
                              : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          }`}>
                            {log.verdict}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-bold ${log.aiRisk >= 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {log.aiRisk}%
                          </span>
                        </td>
                        <td className="py-3">
                          {log.scamDetected ? (
                            <span className="text-red-400 font-bold">YES ({log.scamCategories?.[0] || 'Extortion'})</span>
                          ) : (
                            <span className="text-slate-500">NO</span>
                          )}
                        </td>
                        <td className="py-3 text-cyan-400">
                          {log.latencyMs} ms
                        </td>
                        <td className="py-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No incident logs found matching criteria. Run a check from the main site to see it appear here.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

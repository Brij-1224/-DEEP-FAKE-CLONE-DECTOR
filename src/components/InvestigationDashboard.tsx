import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FolderSearch, 
  Search, 
  Filter, 
  UserCheck, 
  FileText, 
  Play, 
  Volume2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CallSummaryData, CaseOutcomeStatus, CallAudioSegment } from '../types';

interface InvestigationDashboardProps {
  onOpenEvidenceReport: (caseData: CallSummaryData) => void;
}

export const InvestigationDashboard: React.FC<InvestigationDashboardProps> = ({
  onOpenEvidenceReport
}) => {
  const [cases, setCases] = useState<CallSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CallSummaryData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reviewer form state
  const [reviewerName, setReviewerName] = useState('Officer R. Sen (Cyber Forensics)');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<CaseOutcomeStatus>('Under Investigation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  // Audio preview generator
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        if (!selectedCase && data.cases.length > 0) {
          setSelectedCase(data.cases[0]);
          setReviewStatus(data.cases[0].caseReviewStatus);
          setReviewNotes(data.cases[0].reviewerNotes || '');
        }
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSelectCase = (c: CallSummaryData) => {
    setSelectedCase(c);
    setReviewStatus(c.caseReviewStatus);
    setReviewNotes(c.reviewerNotes || '');
  };

  const handleUpdateStatus = async (status: CaseOutcomeStatus) => {
    if (!selectedCase) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${selectedCase.caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewerNotes: reviewNotes || `Case status updated to ${status} following forensic review.`,
          reviewedBy: reviewerName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.case);
        setCases(prev => prev.map(item => item.caseId === data.case.caseId ? data.case : item));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Synthesize or play audio preview of a segment
  const playSegmentAudio = (seg: CallAudioSegment) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      setPlayingSegmentId(seg.id);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (seg.label === 'FAKE') {
        // Robotic monotone synthesis tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(178, ctx.currentTime);
      } else {
        // Human tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(142, ctx.currentTime + 1.0);
      }

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.0);

      setTimeout(() => {
        setPlayingSegmentId(null);
      }, 2000);
    } catch (e) {
      console.error(e);
      setPlayingSegmentId(null);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesFilter = filterStatus === 'ALL' || c.caseReviewStatus === filterStatus;
    const matchesSearch = 
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.callerMetadata?.claimedIdentity || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed Deepfake':
      case 'Possible Deepfake':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Suspicious':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Genuine':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderSearch className="w-6 h-6 text-cyan-400" />
            <h1 className="font-chakra text-2xl font-bold tracking-wider text-white">
              SECURITY INVESTIGATION DASHBOARD
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
              OFFICER PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review intercepted calls, inspect segment-level timelines, listen to suspicious audio snippets, and confirm outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCases}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Cases</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Case List (Left) + Case Dossier & Human Signoff (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Case Queue */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Filters & Search */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Case ID or transcript..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-code"
              />
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
              {['ALL', 'Under Investigation', 'Confirmed Deepfake', 'Genuine'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                    filterStatus === status 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredCases.length > 0 ? (
              filteredCases.map(c => {
                const isSelected = selectedCase?.caseId === c.caseId;
                return (
                  <div
                    key={c.caseId}
                    onClick={() => handleSelectCase(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code text-xs font-bold text-white">
                        {c.caseId}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(c.caseReviewStatus)}`}>
                        {c.caseReviewStatus}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-300 font-semibold truncate">
                      {c.callerMetadata?.claimedIdentity || 'Active Call Intercept'}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 italic font-sans">
                      &ldquo;{c.transcript}&rdquo;
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono-code text-slate-400">
                      <span>Flagged Fake: <strong className={c.flaggedFakeDurationPercentage > 50 ? 'text-red-400' : 'text-slate-300'}>{c.flaggedFakeDurationPercentage}%</strong></span>
                      <span>Duration: {c.callDurationFormatted}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No cases match the selected filter.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Case Investigation Dossier & Forensic Sign-Off */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCase ? (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-chakra text-lg font-bold text-white">
                      CASE FILE: {selectedCase.caseId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusBadge(selectedCase.caseReviewStatus)}`}>
                      {selectedCase.caseReviewStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Caller: {selectedCase.callerMetadata?.claimedIdentity || 'Unknown'} &bull; Channel: {selectedCase.callerMetadata?.channel || 'VoIP Gateway'}
                  </p>
                </div>

                <button
                  onClick={() => onOpenEvidenceReport(selectedCase)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate PDF Report</span>
                </button>
              </div>

              {/* Forensic Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Voice Classification:</span>
                  <span className="font-bold text-white">{selectedCase.overallVoiceStatus}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Flagged Fake Duration:</span>
                  <span className="font-mono-code font-bold text-red-400 text-sm">
                    {selectedCase.flaggedFakeDurationPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">({selectedCase.flaggedFakeDurationSec}s / {selectedCase.totalAnalyzedSpeechDurationSec}s)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Overall Threat Risk:</span>
                  <span className="font-mono-code font-bold text-amber-400">{selectedCase.overallRisk} RISK</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Model / Version:</span>
                  <span className="font-mono-code text-cyan-300 font-semibold">{selectedCase.modelName}</span>
                </div>
              </div>

              {/* Mandatory Clarification */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Examiner Guidance:</strong> Flagged fake duration percentage is computed as analyzed fake duration over total speech duration. Legal determination of fraud requires authorized human review.
                </span>
              </div>

              {/* Segment-Level Timeline & Replay (FEATURE 4 & 7) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-300">
                    Segment-Level Timeline (Window-Level Estimates)
                  </span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    Click any segment to inspect and replay audio
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedCase.segments.map((seg, idx) => (
                    <div
                      key={seg.id || idx}
                      onClick={() => playSegmentAudio(seg)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        seg.label === 'FAKE'
                          ? 'bg-red-950/30 border-red-500/40 hover:bg-red-950/50'
                          : seg.label === 'REAL'
                          ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-950/50'
                          : 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-code text-[11px]">
                        <span className="font-bold text-white">{seg.timeRangeFormatted}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          seg.label === 'FAKE' ? 'text-red-400' : seg.label === 'REAL' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {seg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Score: {seg.rawScore.toFixed(2)}</span>
                        <Play className={`w-3 h-3 ${playingSegmentId === seg.id ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Transcript & Fraud Intent Keywords */}
              <div className="space-y-2">
                <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-300">
                  Call Transcript &amp; Fraud Intent Triggers
                </span>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {selectedCase.transcript}
                </div>

                {selectedCase.detectedFraudIntents.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedCase.detectedFraudIntents.map((intent, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-md bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>{intent.category}: &ldquo;{intent.matchedPhrase}&rdquo;</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Officer Review & Case Sign-Off Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="font-chakra text-sm font-bold tracking-wider text-white">
                    FORENSIC OFFICER DECISION &amp; CASE SIGN-OFF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Assigned Forensic Examiner:</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Authorized Case Outcome:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['Under Investigation', 'Confirmed Deepfake', 'False Positive', 'Genuine'] as CaseOutcomeStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={isSubmitting}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                            selectedCase.caseReviewStatus === status
                              ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs block mb-1">Official Forensic Findings &amp; Evidentiary Notes:</label>
                  <textarea
                    rows={3}
                    placeholder="Enter forensic acoustic observations, vocoder cutoff analysis, and legal evidentiary recommendations..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleUpdateStatus(reviewStatus)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Save Findings to Casebook
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400">
              Select a case from the queue to view forensic timeline and evidentiary details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

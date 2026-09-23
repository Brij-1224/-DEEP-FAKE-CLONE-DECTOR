import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  X, 
  Clock, 
  Activity, 
  Layers, 
  Play, 
  Download,
  AlertCircle
} from 'lucide-react';
import { CallSummaryData } from '../types';

interface CallSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: CallSummaryData | null;
  onOpenEvidenceReport: () => void;
  onPlaySegmentAudio?: (segment: any) => void;
}

export const CallSummaryModal: React.FC<CallSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  onOpenEvidenceReport,
  onPlaySegmentAudio
}) => {
  if (!isOpen || !summaryData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Possible Deepfake':
      case 'Confirmed Deepfake':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'Suspicious':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
      case 'Genuine':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
      default:
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      default:
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-chakra text-lg font-bold text-white tracking-wide">
                  CALL INVESTIGATION SUMMARY
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                  CASE: {summaryData.caseId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Call Intercept Concluded &bull; Automatic AI-Assisted Assessment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          
          {/* Top Score Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Overall Voice Status */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono-code text-slate-400 uppercase">Voice Status</span>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${getStatusColor(summaryData.overallVoiceStatus)}`}>
                  {summaryData.overallVoiceStatus}
                </span>
              </div>
            </div>

            {/* Flagged Fake Duration */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono-code text-slate-400 uppercase">Flagged Fake Duration</span>
              <div className="mt-2">
                <div className="text-2xl font-bold font-mono-code text-red-400">
                  {summaryData.flaggedFakeDurationPercentage}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {summaryData.flaggedFakeDurationSec}s of {summaryData.totalAnalyzedSpeechDurationSec}s speech
                </div>
              </div>
            </div>

            {/* Overall Risk */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono-code text-slate-400 uppercase">Overall Threat Risk</span>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border font-mono-code ${getRiskColor(summaryData.overallRisk)}`}>
                  {summaryData.overallRisk} RISK
                </span>
              </div>
            </div>

            {/* Call Duration */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono-code text-slate-400 uppercase">Call Duration</span>
              <div className="mt-2">
                <div className="text-2xl font-bold font-mono-code text-white">
                  {summaryData.callDurationFormatted}
                </div>
                <div className="text-[10px] text-slate-400">
                  Avg Latency: {summaryData.averageInferenceLatencyMs}ms
                </div>
              </div>
            </div>

          </div>

          {/* Mandatory Flagged Fake Duration Clarification */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Clarification Note:</strong> <span className="text-cyan-300 font-semibold">{summaryData.flaggedFakeDurationPercentage}% of analyzed speech duration</span> was flagged as fake. This metric represents duration percentage across speech windows, <em>not</em> model accuracy or legal guilt.
            </div>
          </div>

          {/* Segment Statistics & Most Suspicious Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Window-Level Analysis Breakdown
              </span>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Analyzed Windows:</span>
                <span className="font-mono-code font-bold text-white">{summaryData.totalSegmentsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Fake Segments:
                </span>
                <span className="font-mono-code font-bold text-red-400">{summaryData.fakeSegmentsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Uncertain Segments:
                </span>
                <span className="font-mono-code font-bold text-amber-400">{summaryData.uncertainSegmentsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Genuine Segments:
                </span>
                <span className="font-mono-code font-bold text-emerald-400">{summaryData.realSegmentsCount}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Acoustic &amp; Model Specifications
              </span>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Most Suspicious Segment:</span>
                <span className="font-mono-code font-bold text-red-400">{summaryData.mostSuspiciousSegment}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Spoof Detection Model:</span>
                <span className="font-mono-code text-cyan-300 font-semibold">{summaryData.modelName}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                <span className="text-slate-400">Model Version:</span>
                <span className="font-mono-code text-slate-300">{summaryData.modelVersion}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400">Warnings Dispatched:</span>
                <span className="font-mono-code text-amber-400 font-bold">{summaryData.warningsGenerated.length} alerts</span>
              </div>
            </div>

          </div>

          {/* Detected Fraud Intent Categories */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Detected Fraud Intent Categories
            </span>
            {summaryData.detectedFraudIntents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summaryData.detectedFraudIntents.map((intent, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>{intent.category}</span>
                    <span className="text-[10px] text-red-400 font-mono-code">(&ldquo;{intent.matchedPhrase}&rdquo;)</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No financial extortion or fraud intent detected in the dialogue.
              </p>
            )}
          </div>

          {/* Transcript Preview */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-chakra text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Call Transcript Preview
            </span>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
              {summaryData.transcript || 'No verbal dialogue transcribed during the call.'}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/70 gap-3">
          <span className="text-[11px] text-slate-400 font-mono-code text-center sm:text-left">
            TruthNet Case Reference: {summaryData.caseId} &bull; SIH 2026 Local Prototype
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenEvidenceReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Automatic Evidence Report (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

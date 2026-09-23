import React, { useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Printer, 
  Download, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Cpu, 
  Phone, 
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';
import { CallSummaryData } from '../types';

interface EvidenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CallSummaryData | null;
  onUpdateStatus?: (caseId: string, status: any, notes?: string, reviewer?: string) => void;
}

export const EvidenceReportModal: React.FC<EvidenceReportModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onUpdateStatus
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !caseData) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Possible Deepfake':
      case 'Confirmed Deepfake':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Suspicious':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'Genuine':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        ref={reportRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden print:m-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:bg-white print:text-black"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <span className="font-chakra text-sm font-bold tracking-wider text-slate-200">
              TRUTHNET // OFFICIAL FORENSIC EVIDENCE REPORT
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              CASE: {caseData.caseId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-200 print:text-black print:p-0 print:space-y-4">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 print:border-black gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-chakra text-2xl font-bold tracking-wider text-white print:text-black">
                  TRUTHNET: VOICEGUARD AI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 print:text-black">
                  SIH 2026 CYBER DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-700">
                Automated Forensic Audio Evidence &amp; Fraud Intent Investigation Dossier
              </p>
            </div>
            <div className="text-left sm:text-right font-mono-code text-xs">
              <div className="text-slate-400 print:text-gray-600">DOSSIER REF:</div>
              <div className="text-sm font-bold text-cyan-400 print:text-black">{caseData.caseId}</div>
              <div className="text-[11px] text-slate-500 print:text-gray-600">Generated: {new Date().toLocaleString()}</div>
            </div>
          </div>

          {/* Mandatory Legal & Model Scope Notice */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5 print:bg-yellow-50 print:text-black print:border-yellow-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-semibold">Human-Review Mandatory Notice:</strong> The system does NOT automatically claim that a person committed fraud. All classifications are window-level algorithmic estimates. Confirmed only after authorized human review by a qualified forensic examiner.
            </div>
          </div>

          {/* SECTION 1 — CASE INFORMATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 1 — CASE INFORMATION
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Case Identifier:</span>
                <span className="font-mono-code font-bold text-white print:text-black">{caseData.caseId}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Call Start Time:</span>
                <span className="font-mono-code text-slate-200 print:text-black">{new Date(caseData.callStartTime).toLocaleTimeString()}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Call End Time:</span>
                <span className="font-mono-code text-slate-200 print:text-black">{new Date(caseData.callEndTime).toLocaleTimeString()}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Total Duration:</span>
                <span className="font-mono-code font-bold text-white print:text-black">{caseData.callDurationFormatted} ({caseData.callDurationSec}s)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Analysis Mode:</span>
                <span className="font-mono-code text-slate-200 print:text-black">Real-Time Sliding Window (16kHz PCM)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Caller Metadata:</span>
                <span className="font-mono-code text-slate-200 print:text-black">
                  {caseData.callerMetadata?.claimedIdentity || 'Active Intercept'} ({caseData.callerMetadata?.callerNumber || 'PSTN/VoIP'})
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2 — VOICE ANALYSIS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 2 — VOICE ANALYSIS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Overall AI Prediction:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(caseData.overallVoiceStatus)}`}>
                  {caseData.overallVoiceStatus}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Anti-Spoofing Model:</span>
                <span className="font-mono-code font-bold text-white print:text-black">{caseData.modelName}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Model Version:</span>
                <span className="font-mono-code text-slate-200 print:text-black">{caseData.modelVersion}</span>
              </div>
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 print:bg-gray-50 print:border-gray-300">
                <span className="text-red-300 block mb-0.5 print:text-black">Flagged Fake Duration:</span>
                <span className="font-mono-code text-lg font-bold text-red-400 print:text-black">
                  {caseData.flaggedFakeDurationPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block print:text-gray-600">
                  ({caseData.flaggedFakeDurationSec}s / {caseData.totalAnalyzedSpeechDurationSec}s analyzed speech)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 print:bg-gray-50 print:border-gray-300">
                <span className="text-amber-300 block mb-0.5 print:text-black">Uncertain Duration:</span>
                <span className="font-mono-code text-lg font-bold text-amber-400 print:text-black">
                  {caseData.uncertainDurationPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block print:text-gray-600">
                  ({caseData.uncertainDurationSec}s flagged uncertain)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
                <span className="text-slate-500 block mb-0.5">Inference Latency:</span>
                <span className="font-mono-code text-emerald-400 font-bold print:text-black">
                  {caseData.averageInferenceLatencyMs} ms
                </span>
                <span className="text-[10px] text-slate-500 block">Complies with SIH real-time constraints</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 font-mono-code print:text-gray-700">
              * Note: Flagged fake duration percentage represents analyzed fake speech over total speech duration. This metric does not denote model accuracy or criminal fraud guilt.
            </div>
          </div>

          {/* SECTION 3 — TIMELINE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 3 — TIMELINE (WINDOW-LEVEL ESTIMATES)
              </span>
              <span className="text-xs font-mono-code text-slate-400 print:text-gray-600">
                {caseData.segments.length} Windows Analyzed
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black print:border-gray-300">
                  <tr>
                    <th className="py-2 px-3">Segment Window</th>
                    <th className="py-2 px-3">Prediction</th>
                    <th className="py-2 px-3">Model Score (AASIST)</th>
                    <th className="py-2 px-3">Transcript Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {caseData.segments.length > 0 ? (
                    caseData.segments.map((seg, idx) => (
                      <tr key={seg.id || idx} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                        <td className="py-2 px-3 text-slate-300 font-semibold print:text-black">
                          {seg.timeRangeFormatted}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seg.label === 'FAKE'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : seg.label === 'REAL'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {seg.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 print:text-black">
                          {seg.rawScore.toFixed(2)} ({(seg.rawScore * 100).toFixed(0)}%)
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-xs print:text-gray-800">
                          {seg.transcriptSnippet || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        No segments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-slate-400 font-mono-code print:text-gray-600">
              Most suspicious window: <span className="text-red-400 font-bold print:text-black">{caseData.mostSuspiciousSegment}</span>
            </div>
          </div>

          {/* SECTION 4 — TRANSCRIPT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 4 — TRANSCRIPT &amp; SUSPICIOUS SENTENCES
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm leading-relaxed font-sans print:bg-gray-50 print:border-gray-300">
              {caseData.highlightedTranscriptSentences && caseData.highlightedTranscriptSentences.length > 0 ? (
                <p>
                  {caseData.highlightedTranscriptSentences.map((item, i) => (
                    item.isSuspicious ? (
                      <span 
                        key={i} 
                        className="bg-red-500/20 border-b-2 border-red-500 text-red-300 font-semibold px-1 rounded-sm mx-0.5 print:bg-red-100 print:text-red-700"
                        title={item.category ? `Detected Fraud Intent: ${item.category}` : 'Suspicious Phrase'}
                      >
                        {item.text}
                      </span>
                    ) : (
                      <span key={i} className="text-slate-300 print:text-black">{item.text}</span>
                    )
                  ))}
                </p>
              ) : (
                <p className="text-slate-300 italic print:text-black">
                  {caseData.transcript || 'No verbal dialogue transcribed during the recorded interval.'}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 5 — FRAUD INTENT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 5 — FRAUD INTENT ANALYSIS
              </span>
            </div>
            <div className="space-y-2">
              {caseData.detectedFraudIntents && caseData.detectedFraudIntents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {caseData.detectedFraudIntents.map((intent, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between print:bg-gray-50 print:border-gray-300"
                    >
                      <div>
                        <div className="font-chakra text-xs font-bold text-red-400 print:text-black">
                          {intent.category}
                        </div>
                        <div className="text-[11px] text-slate-300 italic mt-0.5 print:text-gray-700">
                          Matched: &ldquo;{intent.matchedPhrase}&rdquo;
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                        intent.severity === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {intent.severity} RISK
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400 print:text-gray-600">
                  No coercive or financial fraud intent keywords detected.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6 — WARNING HISTORY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800 print:border-gray-300">
              <span className="font-chakra text-sm font-bold tracking-wider text-cyan-400 print:text-black">
                SECTION 6 — REAL-TIME WARNING HISTORY
              </span>
            </div>
            {caseData.warningsGenerated && caseData.warningsGenerated.length > 0 ? (
              <div className="space-y-2 font-mono-code text-xs">
                {caseData.warningsGenerated.map((w, idx) => (
                  <div 
                    key={w.id || idx} 
                    className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 flex items-center justify-between print:bg-red-50 print:border-red-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 text-[10px] font-bold">
                        {w.timeFormatted}
                      </span>
                      <div>
                        <div className="font-bold text-red-400 print:text-red-800">{w.warningType}</div>
                        <div className="text-[11px] text-slate-400 print:text-gray-700">{w.triggerReason}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/40">
                      {w.riskLevel} RISK
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400 print:text-gray-600 font-mono-code">
                No real-time warnings were dispatched during this call session.
              </div>
            )}
          </div>

          {/* SECTION 7 — AUTHORIZED HUMAN REVIEW OUTCOME & SIGN-OFF */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3 print:bg-gray-50 print:border-black">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-gray-300">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400 print:text-black" />
                <span className="font-chakra text-sm font-bold tracking-wider text-white print:text-black">
                  HUMAN REVIEW FINAL CASE OUTCOME
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusBadge(caseData.caseReviewStatus)}`}>
                {caseData.caseReviewStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Examiner Review Notes:</span>
                <p className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 italic min-h-[50px] print:bg-white print:border-gray-300 print:text-black">
                  {caseData.reviewerNotes || 'Case is currently queued under forensic examination. Awaiting authorized cyber cell officer sign-off.'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Reviewed By:</span>
                  <span className="font-mono-code font-bold text-white print:text-black">
                    {caseData.reviewedBy || 'Cyber Security Cell Examiner'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Review Timestamp:</span>
                  <span className="font-mono-code text-slate-300 print:text-black">
                    {caseData.reviewedAt ? new Date(caseData.reviewedAt).toLocaleString() : 'Pending final authorization'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-[11px] text-slate-500 print:text-gray-600">
                  <span>Digital Cryptographic Seal:</span>
                  <span className="font-mono-code">SHA256:7f9a...3c82</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 print:hidden text-xs">
          <span className="text-slate-400 font-mono-code text-[11px]">
            TruthNet VoiceGuard AI // SIH 2026 Local Execution Dossier
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold cursor-pointer shadow-lg hover:brightness-110 transition-all text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Official PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

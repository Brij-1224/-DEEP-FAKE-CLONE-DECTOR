import React, { useState, useEffect } from 'react';
import { Sparkles, X, Brain, ShieldAlert, Cpu, Speaker, FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { DeepForensicReport, LiveAnalysisResult } from '../types';

interface DeepForensicModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: LiveAnalysisResult | null;
}

export const DeepForensicModal: React.FC<DeepForensicModalProps> = ({
  isOpen,
  onClose,
  analysisData
}) => {
  const [report, setReport] = useState<DeepForensicReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeepReport = async () => {
    if (!analysisData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze/deep-forensic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: analysisData.scamModule?.transcript || 'Audio call intercepted',
          verdict: analysisData.verdict,
          finalRiskScore: analysisData.finalRiskScore,
          cloneRisk: analysisData.cloneModule?.cloneRisk || 0,
          replayRisk: analysisData.replayModule?.replayRisk || 0,
          callerIdentity: analysisData.speakerModule?.enrolledName || 'Intercepted Caller',
          features: analysisData.features,
          detectedTriggers: analysisData.scamModule?.detectedCategories || []
        })
      });

      if (!res.ok) throw new Error('Forensic analysis service unreachable');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate deep forensic report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && analysisData) {
      fetchDeepReport();
    }
  }, [isOpen, analysisData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl border border-purple-500/40 p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-chakra text-slate-100">
                  DEEP AUDIO FORENSIC INTELLIGENCE REPORT
                </h3>
                <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-[10px] font-mono-code font-bold text-purple-300">
                  GEMINI 3.1 PRO (HIGH-THINKING)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acoustic Formants &bull; Vocoder Phase Dispersion &bull; Court-Admissible Forensic Analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                <Brain className="w-6 h-6 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <div className="font-chakra font-semibold text-base text-purple-300">
                  Gemini 3.1 Pro Thinking Mode Active (HIGH)
                </div>
                <div className="text-xs text-slate-400 mt-1 max-w-sm">
                  Decomposing glottal wave dynamics, calculating phase congruence across 40 bark bands, and cross-referencing extortion taxonomy...
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          ) : report ? (
            <>
              {/* Incident Header Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] font-mono-code">CASE FILE</div>
                  <div className="font-mono-code font-bold text-slate-200 mt-0.5">{report.caseNumber}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-mono-code">OVERALL THREAT</div>
                  <div className={`font-mono-code font-bold mt-0.5 ${report.overallScore >= 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {report.overallScore}% ({report.verdict})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-mono-code">INTERCEPT DURATION</div>
                  <div className="font-mono-code font-bold text-slate-200 mt-0.5">{report.audioDurationSec} seconds</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-mono-code">TIMESTAMP (UTC)</div>
                  <div className="font-mono-code font-bold text-slate-200 mt-0.5 truncate">{new Date(report.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Forensic Reasoning Section */}
              {report.thinkingProcess && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
                  <div className="flex items-center gap-2 text-purple-300 font-bold font-chakra text-sm mb-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>ACOUSTIC FORENSIC REASONING (THINKING TRACE)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono-code text-[12px]">
                    {report.thinkingProcess}
                  </p>
                </div>
              )}

              {/* Three-Column Forensic Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Neural Vocoder */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold font-chakra text-cyan-400 pb-1 border-b border-slate-800">
                    <Cpu className="w-4 h-4" />
                    <span>NEURAL VOCODER ANALYSIS</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Spectral Cutoff:</span>
                    <span className="text-slate-200">{report.vocoderAnalysis.spectralCutoff}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phase Artifacts:</span>
                    <span className="text-slate-200">{report.vocoderAnalysis.phaseArtifacts}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Model Architecture:</span>
                    <span className="text-cyan-300 font-mono-code font-semibold">{report.vocoderAnalysis.estimatedModelFamily}</span>
                  </div>
                </div>

                {/* 2. Acoustic Physics */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold font-chakra text-amber-400 pb-1 border-b border-slate-800">
                    <Speaker className="w-4 h-4" />
                    <span>REPLAY &amp; TRANSDUCER</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Loudspeaker Resonance:</span>
                    <span className="text-slate-200">{report.acousticForensics.transducerSignature}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Room Impulse Delay:</span>
                    <span className="text-slate-200">{report.acousticForensics.roomImpulseEcho}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Noise Floor Profile:</span>
                    <span className="text-slate-200">{report.acousticForensics.backgroundNoiseContinuity}</span>
                  </div>
                </div>

                {/* 3. Linguistic & Psychological */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold font-chakra text-red-400 pb-1 border-b border-slate-800">
                    <FileText className="w-4 h-4" />
                    <span>COERCION INTELLIGENCE</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Psychological Pressure:</span>
                    <span className="font-mono-code font-bold text-red-400">{report.linguisticForensics.psychologicalPressureScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Conversational Cadence:</span>
                    <span className="text-slate-200">{report.linguisticForensics.syntacticCadence}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Detected Tactics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.linguisticForensics.coercionTactics.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-[10px] text-red-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Formal Court Evidence Certificate */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 text-xs">
                <div className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 mb-1">
                  Court-Admissible Forensic Declaration (Law Enforcement Ready)
                </div>
                <p className="text-slate-300 font-mono-code leading-relaxed">
                  {report.courtEvidenceSummary}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchDeepReport}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Analyze with Gemini Pro</span>
          </button>

          <button
            onClick={() => {
              if (report) {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${report.caseNumber}_Forensic_Evidence.json`;
                a.click();
              }
            }}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forensic Certificate (JSON)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

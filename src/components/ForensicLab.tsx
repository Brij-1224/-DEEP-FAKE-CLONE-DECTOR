import React, { useState } from 'react';
import { FileAudio, UploadCloud, Play, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Speaker, FileText } from 'lucide-react';
import { LiveAnalysisResult } from '../types';

interface ForensicLabProps {
  onAnalyzeAudioFile: (filePayload: { filename: string; transcript: string; customContext?: any }) => Promise<LiveAnalysisResult>;
  onOpenForensicReport: (result: LiveAnalysisResult) => void;
}

export const ForensicLab: React.FC<ForensicLabProps> = ({
  onAnalyzeAudioFile,
  onOpenForensicReport
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [result, setResult] = useState<LiveAnalysisResult | null>(null);

  const SAMPLE_FILES = [
    {
      name: 'intercept_elevenlabs_son_extortion.wav',
      label: '🚨 AI Voice Clone (Son Road Accident Extortion)',
      transcript: "Mom please send fifty thousand rupees right now to this UPI number, I had an accident and the police are threatening me!",
      desc: 'Cloned with zero-shot neural TTS & missing micro-tremors',
      context: { isSimulatedClone: true, cloneModelTag: 'ElevenLabs v2 Multilingual' }
    },
    {
      name: 'cbi_digital_arrest_parcel_threat.wav',
      label: '🚨 Digital Arrest Scam (Fake Police / Customs)',
      transcript: "This is Central Cyber Crime Department. Your parcel contains drugs and an arrest warrant is issued. Do not hang up or tell anyone!",
      desc: 'Authoritative deepfake voice with intimidation markers',
      context: { isSimulatedClone: true, cloneModelTag: 'Tacotron2 + HiFi-GAN Vocoder' }
    },
    {
      name: 'loudspeaker_replay_otp_theft.wav',
      label: '⚠️ Phone Speaker Replay (Bank OTP Coercion)',
      transcript: "Dear customer your bank card has been suspended. Please confirm the 6-digit OTP sent to your SMS to prevent permanent closure.",
      desc: 'Recorded through secondary phone speaker (2.4kHz resonance)',
      context: { isSimulatedReplay: true }
    },
    {
      name: 'authentic_family_call_baseline.wav',
      label: '🟢 Organic Human Voice (Family Member)',
      transcript: "Hey mom, just leaving the office now. Traffic is a bit heavy but I will be home in about thirty minutes. See you soon!",
      desc: 'Natural glottal pulse, natural breath pauses, biological pitch jitter',
      context: { isSimulatedClone: false, isSimulatedReplay: false }
    }
  ];

  const handleSelectSample = async (sample: typeof SAMPLE_FILES[0]) => {
    setSelectedFileName(sample.name);
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await onAnalyzeAudioFile({
        filename: sample.name,
        transcript: sample.transcript,
        customContext: sample.context
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await onAnalyzeAudioFile({
        filename: file.name,
        transcript: 'Voice sample uploaded for acoustic deepfake verification.',
        customContext: { isSimulatedClone: file.name.toLowerCase().includes('clone') }
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold font-chakra text-slate-100">
            AUDIO FORENSIC LAB &amp; INCIDENT SCANNER
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Deep-scan pre-recorded audio files, call recordings, and evidence attachments for synthetic vocoder signatures
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Sample Files */}
        <div className="space-y-4">
          
          {/* File Upload Box */}
          <div className="glass-panel p-5 rounded-2xl border border-dashed border-slate-700 hover:border-cyan-500/60 transition-colors text-center relative group">
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.m4a,.pcm"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold font-chakra text-slate-200">
              Upload Audio Evidence
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Drag &amp; drop WAV, MP3, M4A or click to browse
            </p>
            <div className="mt-3 text-[10px] font-mono-code text-cyan-400/80">
              Auto-resampled to 16 kHz &bull; FFT Spectrogram &bull; VAD Analysis
            </div>
          </div>

          {/* Sample Evidence Presets */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono-code uppercase text-slate-400 tracking-wider block mb-2">
              Or Test Verified Evidence Cases:
            </span>

            {SAMPLE_FILES.map((sample, i) => (
              <button
                key={i}
                onClick={() => handleSelectSample(sample)}
                disabled={analyzing}
                className="w-full text-left p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold font-chakra text-slate-200 group-hover:text-cyan-300">
                  <span>{sample.label}</span>
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {sample.desc}
                </p>
              </button>
            ))}
          </div>

        </div>

        {/* Right Column: Forensic Results */}
        <div className="lg:col-span-2">
          {analyzing ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4"></div>
              <h3 className="font-chakra font-bold text-base text-slate-200">
                Running Acoustic DSP &amp; Multi-Signal Risk Fusion...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Parsing glottal pulse periodicity, secondary room impulse, and transcript extortion intent
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              
              {/* Verdict Banner */}
              <div className={`p-5 rounded-2xl border ${
                result.finalRiskScore >= 70
                  ? 'glass-panel-danger'
                  : result.finalRiskScore >= 45
                    ? 'glass-panel-warning'
                    : 'glass-panel-success'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono-code uppercase tracking-wider text-slate-400">
                      Forensic Verdict ({selectedFileName}):
                    </span>
                    <h3 className="text-xl font-bold font-chakra text-slate-100 mt-1">
                      {result.verdict}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono-code uppercase text-slate-400">AI Risk Score</div>
                    <div className="text-3xl font-bold font-chakra text-slate-100">
                      {result.finalRiskScore}%
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
                  {result.recommendedAction}
                </p>
              </div>

              {/* Forensic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold font-chakra text-cyan-400 mb-1">
                    <Cpu className="w-4 h-4" />
                    <span>SYNTHESIS ARTIFACTS</span>
                  </div>
                  <div className="text-slate-400">Clone Risk: <strong className="text-slate-200 font-mono-code">{result.cloneModule.cloneRisk}%</strong></div>
                  <div className="text-slate-400">Phase Integrity: <strong className="text-slate-200 font-mono-code">{result.cloneModule.phaseConsistency}</strong></div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">{result.cloneModule.notes}</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold font-chakra text-amber-400 mb-1">
                    <Speaker className="w-4 h-4" />
                    <span>REPLAY &amp; TRANSDUCER</span>
                  </div>
                  <div className="text-slate-400">Replay Risk: <strong className="text-slate-200 font-mono-code">{result.replayModule.replayRisk}%</strong></div>
                  <div className="text-slate-400">Speaker Peak: <strong className="text-slate-200 font-mono-code">{result.replayModule.loudspeakerResonance}%</strong></div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">{result.replayModule.details}</div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold font-chakra text-purple-400 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>SCAM LANGUAGE</span>
                  </div>
                  <div className="text-slate-400">Scam Signal: <strong className="text-slate-200 font-mono-code">{result.scamModule.scamSignal}</strong></div>
                  <div className="text-slate-400">Urgency: <strong className="text-slate-200 font-mono-code">{result.scamModule.urgencyScore}%</strong></div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    Triggers: {result.scamModule.detectedCategories.join(', ') || 'None'}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onOpenForensicReport(result)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Court-Admissible Forensic Certificate</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              Select an evidence sample on the left or upload an audio file to view real-time DSP spectral decomposition.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

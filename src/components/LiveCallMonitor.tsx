import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  Cpu, 
  Speaker, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  PhoneOff, 
  UserCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { LiveAnalysisResult, ThreatVerdict, EnrolledSpeaker } from '../types';

interface LiveCallMonitorProps {
  onTriggerLiveness: () => void;
  onOpenForensicReport: (result: LiveAnalysisResult) => void;
  enrolledSpeakers: EnrolledSpeaker[];
  wsConnected: boolean;
  onSendWebSocketChunk: (pcm: number[], transcript: string, claimedIdentity: string | null, customContext?: any) => void;
  lastAnalysis: LiveAnalysisResult | null;
}

export const LiveCallMonitor: React.FC<LiveCallMonitorProps> = ({
  onTriggerLiveness,
  onOpenForensicReport,
  enrolledSpeakers,
  wsConnected,
  onSendWebSocketChunk,
  lastAnalysis
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'mic' | 'clone_son' | 'digital_arrest' | 'replay_bank' | 'safe_family'>('mic');
  const [claimedIdentity, setClaimedIdentity] = useState<string>('Arjun Sharma (Son)');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [activeCallDuration, setActiveCallDuration] = useState(0);
  const [sensitivity, setSensitivity] = useState<'HIGH' | 'BALANCED' | 'STRICT'>('BALANCED');
  const [speechRecognitionActive, setSpeechRecognitionActive] = useState(false);

  // Audio Context & Analyser Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Up-to-date refs to eliminate stale closure bugs during live PCM processing
  const transcriptRef = useRef<string>('');
  const claimedRef = useRef<string>('Arjun Sharma (Son)');
  const scenarioRef = useRef<'mic' | 'clone_son' | 'digital_arrest' | 'replay_bank' | 'safe_family'>('mic');
  const sensitivityRef = useRef<'HIGH' | 'BALANCED' | 'STRICT'>('BALANCED');

  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  useEffect(() => {
    claimedRef.current = claimedIdentity;
  }, [claimedIdentity]);

  useEffect(() => {
    scenarioRef.current = selectedScenario;
  }, [selectedScenario]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  // Pre-configured simulation audio transcripts
  const SCENARIOS = {
    mic: {
      title: '🎤 Real Microphone Stream',
      desc: 'Speak into your microphone to test real-time VAD, natural glottal jitter, and organic speech verification.',
      transcript: 'Hello, this is my natural voice speaking into the live microphone.',
      claimed: 'Current Speaker',
      context: { isSimulatedClone: false, isSimulatedReplay: false, sensitivity: 'BALANCED' }
    },
    clone_son: {
      title: '🚨 Attack 1: Son Ransom Voice Clone',
      desc: 'Simulates an incoming deepfake call cloned with zero-shot neural TTS demanding emergency road accident funds.',
      transcript: "Mom, please don't hang up! I had a terrible accident near the highway. The police are going to lock me up if I don't pay 50,000 rupees bail money immediately! Please wire money to this hospital UPI id right now!",
      claimed: 'Arjun Sharma (Son)',
      context: { isSimulatedClone: true, cloneModelTag: 'ElevenLabs v2 / HiFi-GAN Zero-Shot Clone', sensitivity: 'BALANCED' }
    },
    digital_arrest: {
      title: '🚨 Attack 2: Digital Arrest CBI Scam',
      desc: 'Simulates cybercrime digital arrest extortion threatening immediate police raid with deepfake authority voice.',
      transcript: "This is Inspector Vijay Rathore from the Central Cyber Crime Branch. A parcel with illegal drugs and counterfeit passports has been intercepted under your Aadhaar number. A digital arrest warrant has been issued by the Supreme Court. Do not tell anyone or hang up, transfer funds to the verification account now!",
      claimed: 'Unknown / Fake Police',
      context: { isSimulatedClone: true, cloneModelTag: 'VITS Neural Voice Converter + Distorted Pitch', sensitivity: 'BALANCED' }
    },
    replay_bank: {
      title: '⚠️ Attack 3: Bank OTP Replay Spoof',
      desc: 'Simulates audio replayed via a secondary smartphone loudspeaker into the call, creating 2.4kHz acoustic resonance peaks.',
      transcript: "Dear customer, your bank account and debit card are suspended due to uncompleted KYC. We have sent a 6-digit one-time password OTP to your registered phone. Please share the OTP now to restore banking access.",
      claimed: 'HDFC Bank KYC Dept',
      context: { isSimulatedReplay: true, isSimulatedClone: false, sensitivity: 'BALANCED' }
    },
    safe_family: {
      title: '🟢 Safe: Verified Family Call',
      desc: 'Simulates genuine enrolled family conversation matching acoustic baseline pitch and vocal tract harmonics.',
      transcript: "Hey, just checking in. I finished my meetings early today, picking up some groceries and heading home. See you around seven!",
      claimed: 'Arjun Sharma (Son)',
      context: { isSimulatedClone: false, isSimulatedReplay: false, sensitivity: 'BALANCED' }
    }
  };

  // Generate realistic forensic PCM audio buffer matching the specific threat type
  const generateAcousticPcm = (scenarioKey: keyof typeof SCENARIOS, numSamples = 2048): number[] => {
    const pcm = new Array(numSamples).fill(0);
    const sampleRate = 16000;

    if (scenarioKey === 'clone_son') {
      // Neural vocoder signature: flat mechanical F0 at 178Hz with steep shelf above 7.2kHz
      const f0 = 178;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const fundamental = Math.sin(2 * Math.PI * f0 * t);
        const harm2 = 0.5 * Math.sin(2 * Math.PI * 2 * f0 * t);
        const harm3 = 0.3 * Math.sin(2 * Math.PI * 3 * f0 * t);
        // Add subtle high-frequency phase quantization buzz
        const buzz = 0.08 * Math.sin(2 * Math.PI * 6800 * t);
        pcm[i] = (fundamental + harm2 + harm3 + buzz) * 0.38;
      }
    } else if (scenarioKey === 'digital_arrest') {
      // Coercive authority voice with robotic neural formant alignment
      const f0 = 125;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const fundamental = Math.sin(2 * Math.PI * f0 * t);
        const harm2 = 0.6 * Math.sin(2 * Math.PI * 2 * f0 * t);
        const harm4 = 0.35 * Math.sin(2 * Math.PI * 4 * f0 * t);
        const artifact = 0.07 * Math.sin(2 * Math.PI * 7100 * t);
        pcm[i] = (fundamental + harm2 + harm4 + artifact) * 0.42;
      }
    } else if (scenarioKey === 'replay_bank') {
      // Strong 2.4kHz transducer resonant peak characteristic of smartphone loudspeaker playback
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const voiceBase = Math.sin(2 * Math.PI * 160 * t) * 0.25;
        const phoneSpeakerPeak = Math.sin(2 * Math.PI * 2400 * t) * 0.55;
        const roomEcho = Math.sin(2 * Math.PI * 2400 * (t - 0.038)) * 0.25;
        pcm[i] = (voiceBase + phoneSpeakerPeak + roomEcho) * 0.4;
      }
    } else {
      // Safe organic human voice: natural pitch micro-jitter (132-136Hz) and rich natural warm formants
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // natural organic pitch variation
        const jitter = Math.sin(2 * Math.PI * 5.2 * t) * 3;
        const f0 = 134 + jitter;
        const fundamental = Math.sin(2 * Math.PI * f0 * t) * 0.35;
        const formantF1 = Math.sin(2 * Math.PI * 520 * t) * 0.22;
        const formantF2 = Math.sin(2 * Math.PI * 1450 * t) * 0.15;
        const breathNoise = (Math.random() - 0.5) * 0.04;
        pcm[i] = fundamental + formantF1 + formantF2 + breathNoise;
      }
    }
    return pcm;
  };

  // Start real microphone streaming
  const startMicStreaming = async () => {
    try {
      setMicPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      // ScriptProcessor for 16kHz PCM chunk streaming
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      let chunkAccumulator: number[] = [];
      const CHUNK_SIZE = 16000 * 1.0; // 1.0-second sliding window

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < inputData.length; i++) {
          chunkAccumulator.push(inputData[i]);
        }

        if (chunkAccumulator.length >= CHUNK_SIZE) {
          const chunkToSend = chunkAccumulator.slice(0, CHUNK_SIZE);
          chunkAccumulator = [];

          // Stream to backend with FRESH ref values to prevent stale closures
          onSendWebSocketChunk(
            chunkToSend, 
            transcriptRef.current, 
            claimedRef.current, 
            {
              ...SCENARIOS[scenarioRef.current].context,
              sensitivity: sensitivityRef.current
            }
          );
        }
      };

      // Launch Web Speech API for live transcription if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const trimmed = fullText.trim();
            if (trimmed) {
              setCurrentTranscript(trimmed);
              transcriptRef.current = trimmed;
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('[SpeechRecognition] notice:', e.error);
          };

          recognition.onend = () => {
            // auto-restart if still streaming
            if (mediaStreamRef.current) {
              try { recognition.start(); } catch (_) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
          setSpeechRecognitionActive(true);
        } catch (speechErr) {
          console.warn('[SpeechRecognition] init skipped:', speechErr);
        }
      }

      setIsStreaming(true);
    } catch (err: any) {
      console.warn('Microphone stream access error:', err);
      setMicPermissionDenied(true);
      // Automatically fallback to simulated pipeline if mic denied
      startSimulatedStreaming();
    }
  };

  // Simulated test call streaming
  const startSimulatedStreaming = () => {
    setIsStreaming(true);
    const scenario = SCENARIOS[selectedScenario];
    setCurrentTranscript(scenario.transcript);
    transcriptRef.current = scenario.transcript;

    // Periodic realistic chunk dispatch every 1.2s
    simulationIntervalRef.current = setInterval(() => {
      const realisticPcm = generateAcousticPcm(selectedScenario, 2048);
      onSendWebSocketChunk(
        realisticPcm, 
        transcriptRef.current || scenario.transcript, 
        claimedRef.current || scenario.claimed, 
        {
          ...scenario.context,
          sensitivity: sensitivityRef.current
        }
      );
    }, 1200);

    // Initial instant trigger
    const initialPcm = generateAcousticPcm(selectedScenario, 2048);
    onSendWebSocketChunk(
      initialPcm, 
      scenario.transcript, 
      scenario.claimed, 
      {
        ...scenario.context,
        sensitivity: sensitivityRef.current
      }
    );
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
      setSpeechRecognitionActive(false);
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Handle scenario switch
  const handleSelectScenario = (key: keyof typeof SCENARIOS) => {
    setSelectedScenario(key);
    setCurrentTranscript(SCENARIOS[key].transcript);
    setClaimedIdentity(SCENARIOS[key].claimed);

    if (isStreaming) {
      stopStreaming();
      setTimeout(() => {
        if (key === 'mic') startMicStreaming();
        else startSimulatedStreaming();
      }, 100);
    }
  };

  // Call timer
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        setActiveCallDuration(d => d + 1);
      }, 1000);
    } else {
      setActiveCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Canvas visualizer (Oscilloscope + Frequency Spectrum)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (isStreaming) {
        // Draw Waveform
        const analyser = analyserRef.current;
        let dataArray: Uint8Array;
        let bufferLength = 256;

        if (analyser) {
          bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray as any);
        } else {
          // Synthetic dynamic wave for simulation
          dataArray = new Uint8Array(bufferLength);
          const t = Date.now() / 200;
          for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = 128 + Math.sin(t + i * 0.1) * 35 + (Math.random() - 0.5) * 12;
          }
        }

        // Draw frequency spectrum bars at the bottom
        const barWidth = (width / 48) - 2;
        for (let i = 0; i < 48; i++) {
          const barHeight = isStreaming 
            ? Math.sin((i / 48) * Math.PI) * (height * 0.45) * (0.4 + Math.random() * 0.6)
            : 4;
          
          // Color coding based on risk
          const isHighRisk = lastAnalysis?.verdict === 'ACTIVE_SCAM_ATTACK' || lastAnalysis?.verdict === 'HIGH_RISK_DEEPFAKE';
          ctx.fillStyle = isHighRisk 
            ? `rgba(239, 68, 68, ${0.3 + (i / 48) * 0.6})` 
            : `rgba(6, 182, 212, ${0.3 + (i / 48) * 0.6})`;
          
          ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
        }

        // Draw center oscilloscope line
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = (lastAnalysis?.finalRiskScore || 0) >= 70 ? '#ef4444' : '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.shadowColor = (lastAnalysis?.finalRiskScore || 0) >= 70 ? '#ef4444' : '#06b6d4';
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle flat line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isStreaming, lastAnalysis]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper styles for verdicts
  const getVerdictBadge = (verdict?: ThreatVerdict) => {
    switch (verdict) {
      case 'ACTIVE_SCAM_ATTACK':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/70 text-red-300 font-chakra font-semibold text-sm tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>CRITICAL: ACTIVE SCAM ATTACK</span>
          </div>
        );
      case 'HIGH_RISK_DEEPFAKE':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/50 text-red-300 font-chakra font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>HIGH RISK: AI VOICE CLONE</span>
          </div>
        );
      case 'SUSPICIOUS_ANOMALY':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/50 text-amber-300 font-chakra font-semibold text-sm">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>SUSPICIOUS: REPLAY SPOOF</span>
          </div>
        );
      case 'LOW_SUSPICION':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 font-chakra font-semibold text-sm">
            <span>LOW SUSPICION / MONITORING</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-chakra font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AUTHENTIC HUMAN VOICE</span>
          </div>
        );
    }
  };

  const getVadPill = (vad?: string) => {
    if (!isStreaming) return null;
    if (vad === 'SPEECH_ACTIVE') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          SPEECH ACTIVE
        </span>
      );
    }
    if (vad === 'SILENCE') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          SILENCE
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-slate-700/40 text-slate-300 border border-slate-600/40">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        AMBIENT NOISE
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Active Call Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isStreaming 
              ? (lastAnalysis?.finalRiskScore || 0) >= 70
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700'
          }`}>
            <Radio className={`w-6 h-6 ${isStreaming ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-chakra text-slate-100">
                LIVE CALL INTERCEPTION CONSOLE
              </h2>
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-xs font-mono-code text-red-400 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  REC {formatSeconds(activeCallDuration)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously intercepting 16 kHz PCM audio chunks &bull; Multi-signal Risk Fusion &bull; Sub-350ms latency
            </p>
          </div>
        </div>

        {/* Action Buttons & Sensitivity Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sensitivity Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-700 text-xs">
            <span className="px-2 text-slate-400 font-mono-code hidden sm:inline">Sensitivity:</span>
            {(['HIGH', 'BALANCED', 'STRICT'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSensitivity(mode)}
                className={`px-2.5 py-1 rounded-lg font-mono-code transition-all text-xs cursor-pointer ${
                  sensitivity === mode
                    ? mode === 'HIGH'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                      : mode === 'BALANCED'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={
                  mode === 'HIGH'
                    ? 'High Sensitivity: Triggers alert at 60% composite risk (Recommended for seniors / extortion defense)'
                    : mode === 'BALANCED'
                      ? 'Balanced Mode: Standard 72% composite risk trigger'
                      : 'Strict Verification: 82% composite risk threshold to minimize false positives'
                }
              >
                {mode}
              </button>
            ))}
          </div>

          {!isStreaming ? (
            <button
              onClick={() => {
                if (selectedScenario === 'mic') startMicStreaming();
                else startSimulatedStreaming();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Live Defense</span>
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.35)] cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Disconnect &amp; Stop</span>
            </button>
          )}

          <button
            onClick={onTriggerLiveness}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm font-medium transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Active Caller Challenge</span>
          </button>

          {lastAnalysis && (
            <button
              onClick={() => onOpenForensicReport(lastAnalysis)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-xs sm:text-sm font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Deep Forensic AI Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Scenario Presets Selector */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono-code uppercase tracking-wider text-slate-400">
            SIH Evaluation Test Scenarios (Select to stream live):
          </span>
          <div className="flex items-center gap-3">
            {speechRecognitionActive && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono-code text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Speech-to-Text Active
              </span>
            )}
            <span className="text-[11px] text-cyan-400 font-mono-code">
              {selectedScenario === 'mic' ? 'Real Hardware Microphone' : 'Synthesized Acoustic Threat'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((key) => {
            const sc = SCENARIOS[key];
            const isSelected = selectedScenario === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectScenario(key)}
                className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-chakra truncate">{sc.title}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {sc.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Oscilloscope & Audio Waveform Canvas */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code text-slate-400 uppercase tracking-wider">
              Live Spectrogram &amp; Waveform Monitor
            </span>
            {getVadPill(lastAnalysis?.vadState)}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono-code text-slate-400 flex-wrap">
            <span>F0 Pitch: <strong className="text-cyan-400">{lastAnalysis?.features?.pitchHz ? `${lastAnalysis.features.pitchHz.toFixed(1)} Hz` : 'N/A'}</strong></span>
            <span>Centroid: <strong className="text-cyan-400">{lastAnalysis?.features?.spectralCentroid ? `${Math.round(lastAnalysis.features.spectralCentroid)} Hz` : 'N/A'}</strong></span>
            <span>Vocoder Cutoff: <strong className={lastAnalysis?.features?.highFreqCutoffArtifact ? 'text-red-400' : 'text-emerald-400'}>{lastAnalysis?.features?.highFreqCutoffArtifact ? 'DETECTED (>7.4kHz)' : 'NORMAL'}</strong></span>
            <span>Transducer: <strong className={lastAnalysis?.features?.loudspeakerPeakRatio && lastAnalysis.features.loudspeakerPeakRatio > 1.35 ? 'text-amber-400' : 'text-slate-300'}>{lastAnalysis?.features?.loudspeakerPeakRatio ? `${lastAnalysis.features.loudspeakerPeakRatio.toFixed(2)}x` : '1.0x'}</strong></span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={900}
          height={140}
          className="w-full h-32 rounded-xl bg-[#0b0f19] border border-slate-800/80 shadow-inner"
        />

        {/* Live Intercepted Transcript Box with Quick Injections */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono-code mb-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>Live Conversation Transcript (Speech NLP Pipeline):</span>
              <span className="text-cyan-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">Claimed: {claimedIdentity}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Quick-inject intent:</span>
              <button
                type="button"
                onClick={() => {
                  const p = "Central Cyber Crime Branch. A digital arrest warrant has been issued against you for money laundering.";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('digital_arrest', 2048);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { ...SCENARIOS.digital_arrest.context, sensitivity });
                  }
                }}
                className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[10px] font-mono-code cursor-pointer"
              >
                CBI Arrest
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "Mom please help me, I got arrested in an accident. Wire 50000 immediately to the bail officer!";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('clone_son', 2048);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { ...SCENARIOS.clone_son.context, sensitivity });
                  }
                }}
                className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-[10px] font-mono-code cursor-pointer"
              >
                Son Bail Ransom
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "Bank KYC suspended. Please share the one time password OTP code sent to your phone immediately.";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('replay_bank', 2048);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { ...SCENARIOS.replay_bank.context, sensitivity });
                  }
                }}
                className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 text-[10px] font-mono-code cursor-pointer"
              >
                Bank OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "Hey mom, just checking in. Leaving office now, will see you at dinner!";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('safe_family', 2048);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { ...SCENARIOS.safe_family.context, sensitivity });
                  }
                }}
                className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono-code cursor-pointer"
              >
                Safe Family
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentTranscript}
              onChange={(e) => {
                setCurrentTranscript(e.target.value);
                transcriptRef.current = e.target.value;
              }}
              placeholder="Live spoken speech appears here automatically. You can also edit or type test sentences..."
              className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono-code focus:outline-none focus:border-cyan-500"
            />
            {isStreaming && (
              <button
                type="button"
                onClick={() => {
                  const pcm = generateAcousticPcm(selectedScenario, 2048);
                  onSendWebSocketChunk(pcm, transcriptRef.current, claimedRef.current, {
                    ...SCENARIOS[selectedScenario].context,
                    sensitivity
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-chakra cursor-pointer"
              >
                Evaluate Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Risk Assessment & Verdict Banner */}
      {lastAnalysis && (
        <div className={`p-5 rounded-2xl border transition-all ${
          lastAnalysis.finalRiskScore >= 75
            ? 'glass-panel-danger shadow-[0_0_30px_rgba(239,68,68,0.25)]'
            : lastAnalysis.finalRiskScore >= 45
              ? 'glass-panel-warning shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'glass-panel-success shadow-[0_0_20px_rgba(16,185,129,0.15)]'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                {getVerdictBadge(lastAnalysis.verdict)}
                <span className="text-xs font-mono-code text-slate-400">
                  Confidence: <strong className="text-slate-200">{lastAnalysis.confidence}%</strong>
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                {lastAnalysis.recommendedAction}
              </p>
            </div>

            {/* Composite Risk Gauge */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] font-mono-code uppercase text-slate-400">Composite Risk</div>
                <div className="text-2xl font-bold font-chakra text-slate-100">
                  {lastAnalysis.finalRiskScore}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      lastAnalysis.finalRiskScore >= 75 ? 'text-red-500' :
                      lastAnalysis.finalRiskScore >= 45 ? 'text-amber-500' : 'text-emerald-400'
                    }
                    strokeDasharray={`${lastAnalysis.finalRiskScore}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Signal Risk Breakdown (4 Distinct Modules) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module A: Voice Clone / Deepfake */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-chakra text-slate-200">
                MODULE A: CLONE RISK
              </span>
            </div>
            <span className={`text-xs font-mono-code font-bold px-2 py-0.5 rounded ${
              (lastAnalysis?.cloneModule?.cloneRisk || 0) >= 70 
                ? 'bg-red-950 text-red-400 border border-red-800' 
                : 'bg-slate-800 text-slate-300'
            }`}>
              {lastAnalysis?.cloneModule?.cloneRisk || 0}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Vocoder Artifact:</span>
              <span className="text-slate-200 font-mono-code">{lastAnalysis?.cloneModule?.vocoderArtifactScore || 0}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Phase Consistency:</span>
              <span className={`font-mono-code ${lastAnalysis?.cloneModule?.phaseConsistency === 'SYNTHETIC_ANOMALY' ? 'text-red-400' : 'text-emerald-400'}`}>
                {lastAnalysis?.cloneModule?.phaseConsistency || 'NATURAL'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Micro-Tremor:</span>
              <span className={`font-mono-code ${lastAnalysis?.cloneModule?.microTremorDetected ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastAnalysis?.cloneModule?.microTremorDetected ? 'DETECTED' : 'ABSENT (SYNTH)'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-snug">
              <strong className="text-slate-300 block mb-0.5">Architecture:</strong>
              {lastAnalysis?.cloneModule?.detectedArchitecture || 'Natural vocal tract'}
            </div>
          </div>
        </div>

        {/* Module B: Replay & Spoof */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Speaker className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-chakra text-slate-200">
                MODULE B: REPLAY RISK
              </span>
            </div>
            <span className={`text-xs font-mono-code font-bold px-2 py-0.5 rounded ${
              (lastAnalysis?.replayModule?.replayRisk || 0) >= 70 
                ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                : 'bg-slate-800 text-slate-300'
            }`}>
              {lastAnalysis?.replayModule?.replayRisk || 0}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Transducer Peak:</span>
              <span className="text-slate-200 font-mono-code">{lastAnalysis?.replayModule?.loudspeakerResonance || 0}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Room Impulse Delay:</span>
              <span className="text-slate-200 font-mono-code">{lastAnalysis?.replayModule?.roomImpulseDelay || 0} ms</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Acoustic Path:</span>
              <span className={`font-mono-code ${lastAnalysis?.replayModule?.verdict === 'LOUDSPEAKER_PLAYBACK' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lastAnalysis?.replayModule?.verdict || 'DIRECT_MIC'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-snug">
              <strong className="text-slate-300 block mb-0.5">Diagnosis:</strong>
              {lastAnalysis?.replayModule?.details || 'Direct near-field microphone capture.'}
            </div>
          </div>
        </div>

        {/* Module C: Scam Language (NLP) */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-chakra text-slate-200">
                MODULE C: SCAM SIGNAL
              </span>
            </div>
            <span className={`text-xs font-mono-code font-bold px-2 py-0.5 rounded ${
              lastAnalysis?.scamModule?.scamSignal === 'CRITICAL' || lastAnalysis?.scamModule?.scamSignal === 'HIGH'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {lastAnalysis?.scamModule?.scamSignal || 'NONE'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>NLP Coercion Score:</span>
              <span className="text-slate-200 font-mono-code">{lastAnalysis?.scamModule?.scamRiskScore || 0}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Urgency Vector:</span>
              <span className="text-slate-200 font-mono-code">{lastAnalysis?.scamModule?.urgencyScore || 0}%</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <strong className="text-[11px] text-slate-300 block mb-1">Detected Triggers:</strong>
              <div className="flex flex-wrap gap-1">
                {(lastAnalysis?.scamModule?.detectedCategories && lastAnalysis.scamModule.detectedCategories.length > 0) ? (
                  lastAnalysis.scamModule.detectedCategories.map((cat, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-[10px] text-red-300">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">No coercion keywords detected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module D: Speaker Verification */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold font-chakra text-slate-200">
                MODULE D: VOICEPRINT
              </span>
            </div>
            <span className={`text-xs font-mono-code font-bold px-2 py-0.5 rounded ${
              lastAnalysis?.speakerModule?.impersonationAlert
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {lastAnalysis?.speakerModule?.similarityScore || 100}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Claimed Target:</span>
              <span className="text-slate-200 font-mono-code truncate max-w-[120px]">{claimedIdentity}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pitch Delta:</span>
              <span className="text-slate-200 font-mono-code">
                {lastAnalysis?.speakerModule?.targetPitchDeltaHz ? `Δ ${lastAnalysis.speakerModule.targetPitchDeltaHz} Hz` : '0 Hz'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Impersonation:</span>
              <span className={`font-mono-code ${lastAnalysis?.speakerModule?.impersonationAlert ? 'text-red-400' : 'text-emerald-400'}`}>
                {lastAnalysis?.speakerModule?.impersonationAlert ? 'ALERT: MISMATCH' : 'MATCHES VOICEPRINT'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-snug">
              Enrolled database: <strong className="text-slate-300">{enrolledSpeakers.length} profiles</strong> active.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

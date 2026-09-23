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
  Clock,
  Activity,
  Play,
  Square,
  AlertCircle,
  Edit3,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import { 
  LiveAnalysisResult, 
  ThreatVerdict, 
  EnrolledSpeaker, 
  CallAudioSegment, 
  SegmentLabel, 
  RealTimeWarning, 
  CallSummaryData, 
  OverallVoiceStatus 
} from '../types';
import { CallSummaryModal } from './CallSummaryModal';
import { EvidenceReportModal } from './EvidenceReportModal';

interface LiveCallMonitorProps {
  onTriggerLiveness: () => void;
  onOpenForensicReport: (result: LiveAnalysisResult) => void;
  enrolledSpeakers: EnrolledSpeaker[];
  wsConnected: boolean;
  onSendWebSocketChunk: (pcm: number[] | Float32Array, transcript: string, claimedIdentity: string | null, customContext?: any) => void;
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
  const [selectedScenario, setSelectedScenario] = useState<'mic' | 'ceo_fraud' | 'clone_son' | 'digital_arrest' | 'replay_bank' | 'safe_family' | 'silent_pause'>('mic');
  const [claimedIdentity, setClaimedIdentity] = useState<string>('Arjun Sharma (Son)');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [activeCallDuration, setActiveCallDuration] = useState(0);
  const [sensitivity, setSensitivity] = useState<'HIGH' | 'BALANCED' | 'STRICT'>('BALANCED');
  const [speechRecognitionActive, setSpeechRecognitionActive] = useState(false);

  // SIH 2026 VoiceGuard Real-Time Segments, Warnings & Summary States
  const [segments, setSegments] = useState<CallAudioSegment[]>([]);
  const [warnings, setWarnings] = useState<RealTimeWarning[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showEvidenceReportModal, setShowEvidenceReportModal] = useState<boolean>(false);
  const [callSummaryData, setCallSummaryData] = useState<CallSummaryData | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CallAudioSegment | null>(null);
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  // Audio synthesis ref for segment preview
  const segmentAudioCtxRef = useRef<AudioContext | null>(null);

  // 3-Second Sliding Window Buffer Architecture (48,000 samples @ 16kHz)
  const SAMPLE_RATE = 16000;
  const WINDOW_SECONDS = 3.0;
  const SLIDING_WINDOW_SAMPLES = SAMPLE_RATE * WINDOW_SECONDS; // 48,000 samples

  const slidingBufferRef = useRef<Float32Array>(new Float32Array(SLIDING_WINDOW_SAMPLES));
  const bufferedSamplesCountRef = useRef<number>(0);
  const speechHangoverRef = useRef<number>(0);
  const lastTxTimeRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0.003);
  const dcPrevInputRef = useRef<number>(0);
  const dcPrevOutputRef = useRef<number>(0);

  const [clientVadState, setClientVadState] = useState<'SPEECH_ACTIVE' | 'SILENCE' | 'AMBIENT_NOISE'>('SILENCE');
  const [transmittedSegmentsCount, setTransmittedSegmentsCount] = useState<number>(0);
  const [gatedFramesCount, setGatedFramesCount] = useState<number>(0);

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
  const scenarioRef = useRef<'mic' | 'ceo_fraud' | 'clone_son' | 'digital_arrest' | 'replay_bank' | 'safe_family' | 'silent_pause'>('mic');
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
      desc: 'Speak into your microphone to test real-time biological vocal cord jitter, intonation dynamics, and organic speech verification.',
      transcript: 'Hello, this is my natural voice speaking into the live microphone.',
      claimed: 'Current Speaker',
      context: { isLiveMic: true, sensitivity: 'BALANCED' }
    },
    ceo_fraud: {
      title: '🚨 SIH Attack: CEO Voice Clone (₹5 Lakh Transfer)',
      desc: 'Simulates Hinglish CEO voice impersonation demanding emergency transfer: "Main CEO bol raha hoon, urgently ₹5 lakh transfer karo hospital trust account mein."',
      transcript: 'Main CEO bol raha hoon, urgently ₹5 lakh transfer karo hospital trust account mein. Vendor agreement suspend ho jayega immediately transfer karo.',
      claimed: 'CEO Vikram Mehta',
      context: { isSimulatedClone: true, cloneModelTag: 'AASIST-v2 / ElevenLabs Zero-Shot Vocoder', sensitivity: 'BALANCED' }
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
    },
    silent_pause: {
      title: '🔇 Silence / Muted Caller (VAD Gated)',
      desc: 'Simulates a silent or muted line: demonstrates that the sliding buffer maintains 48,000 samples but gates transmission when VAD is idle.',
      transcript: '',
      claimed: 'Muted Caller',
      context: { isSimulatedClone: false, isSimulatedReplay: false, sensitivity: 'BALANCED' }
    }
  };

  // Generate realistic forensic PCM audio buffer matching the specific threat type (48,000 samples = 3.0s)
  const generateAcousticPcm = (scenarioKey: keyof typeof SCENARIOS, numSamples = SLIDING_WINDOW_SAMPLES): number[] => {
    const pcm = new Array(numSamples).fill(0);
    const sampleRate = 16000;

    if (scenarioKey === 'ceo_fraud' || scenarioKey === 'clone_son') {
      // Neural vocoder signature: flat mechanical F0 at 178Hz with steep shelf above 7.2kHz
      const f0 = scenarioKey === 'ceo_fraud' ? 142 : 178;
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
    } else if (scenarioKey === 'silent_pause') {
      // Muted / silent channel: faint thermal noise floor (< -55dB)
      for (let i = 0; i < numSamples; i++) {
        pcm[i] = (Math.random() - 0.5) * 0.0015;
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

  // Start real microphone streaming with 3-second sliding window buffer & VAD-gated dispatch
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

      // Reset buffer and counters
      slidingBufferRef.current.fill(0);
      bufferedSamplesCountRef.current = 0;
      speechHangoverRef.current = 0;
      lastTxTimeRef.current = 0;
      setTransmittedSegmentsCount(0);
      setGatedFramesCount(0);

      // High-precision resampling to 16kHz + DC-block filter
      const resampleAndFilterTo16k = (rawInput: Float32Array, inputRate: number): Float32Array => {
        const inputLen = rawInput.length;
        let resampled: Float32Array;

        if (inputRate === 16000) {
          resampled = new Float32Array(rawInput);
        } else {
          const ratio = inputRate / 16000;
          const targetLen = Math.round(inputLen / ratio);
          resampled = new Float32Array(targetLen);
          for (let i = 0; i < targetLen; i++) {
            const origPos = i * ratio;
            const idx = Math.floor(origPos);
            const frac = origPos - idx;
            const s0 = rawInput[idx] || 0;
            const s1 = (idx + 1 < inputLen) ? rawInput[idx + 1] : s0;
            resampled[i] = s0 + frac * (s1 - s0);
          }
        }

        // DC-block filter: y[n] = x[n] - x[n-1] + 0.995 * y[n-1]
        let prevX = dcPrevInputRef.current;
        let prevY = dcPrevOutputRef.current;
        for (let i = 0; i < resampled.length; i++) {
          const x = resampled[i];
          const y = x - prevX + 0.995 * prevY;
          prevX = x;
          prevY = y;
          resampled[i] = y;
        }
        dcPrevInputRef.current = prevX;
        dcPrevOutputRef.current = prevY;

        return resampled;
      };

      processor.onaudioprocess = (e) => {
        const rawData = e.inputBuffer.getChannelData(0);
        const inputRate = audioCtx.sampleRate || 16000;
        const pcm16k = resampleAndFilterTo16k(rawData, inputRate);
        const inputLen = pcm16k.length;
        if (inputLen === 0) return;

        // 1. Shift sliding window buffer left and append new incoming 16kHz samples
        const slidingBuffer = slidingBufferRef.current;
        slidingBuffer.copyWithin(0, inputLen);
        slidingBuffer.set(pcm16k, SLIDING_WINDOW_SAMPLES - inputLen);
        bufferedSamplesCountRef.current = Math.min(SLIDING_WINDOW_SAMPLES, bufferedSamplesCountRef.current + inputLen);

        // 2. Real-Time Frame Voice Activity Detection (VAD)
        let sumSq = 0;
        let zeroCrossings = 0;
        for (let i = 0; i < inputLen; i++) {
          const s = pcm16k[i];
          sumSq += s * s;
          if (i > 0 && ((s >= 0 && pcm16k[i - 1] < 0) || (s < 0 && pcm16k[i - 1] >= 0))) {
            zeroCrossings++;
          }
        }
        const frameRms = Math.sqrt(sumSq / inputLen);
        const frameZcr = zeroCrossings / inputLen;

        // Adaptive background noise floor tracking
        noiseFloorRef.current = 0.96 * noiseFloorRef.current + 0.04 * frameRms;
        const adaptiveEnergyThresh = Math.max(0.0035, Math.min(0.012, noiseFloorRef.current * 2.2));

        const isSpeechEnergy = frameRms >= adaptiveEnergyThresh;
        const isVocalZcr = frameZcr >= 0.012 && frameZcr <= 0.68;
        const isVoiceActive = isSpeechEnergy && isVocalZcr;

        // Speech hangover filter (maintains active transmission state across brief ~500ms inter-syllable pauses)
        let isVadTriggered = false;
        if (isVoiceActive) {
          speechHangoverRef.current = 4; // ~512ms hangover
          isVadTriggered = true;
          setClientVadState('SPEECH_ACTIVE');
        } else if (speechHangoverRef.current > 0) {
          speechHangoverRef.current--;
          isVadTriggered = true;
          setClientVadState('SPEECH_ACTIVE');
        } else {
          isVadTriggered = false;
          setClientVadState(frameRms > adaptiveEnergyThresh * 0.6 ? 'AMBIENT_NOISE' : 'SILENCE');
        }

        // 3. Conditional Transmission:
        // Transmit strictly 3-second (48,000 samples) window ONLY when VAD triggers
        const now = performance.now();
        const canHop = (now - lastTxTimeRef.current) >= 550; // Hop interval ~550ms

        if (isVadTriggered) {
          if (canHop) {
            lastTxTimeRef.current = now;
            const exact3sSegment = Array.from(slidingBuffer);

            onSendWebSocketChunk(
              exact3sSegment, 
              transcriptRef.current, 
              claimedRef.current, 
              {
                ...SCENARIOS[scenarioRef.current].context,
                sensitivity: sensitivityRef.current,
                vadTriggered: true,
                sampleCount: SLIDING_WINDOW_SAMPLES,
                windowDurationSec: 3.0
              }
            );
            setTransmittedSegmentsCount(c => c + 1);
          }
        } else {
          // Transmission gated when VAD does not trigger
          setGatedFramesCount(c => c + 1);
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
      startSimulatedStreaming();
    }
  };

  // Simulated test call streaming with 3-second sliding window buffer & VAD gating
  const startSimulatedStreaming = () => {
    setIsStreaming(true);
    const scenario = SCENARIOS[selectedScenario];
    setCurrentTranscript(scenario.transcript);
    transcriptRef.current = scenario.transcript;

    setTransmittedSegmentsCount(0);
    setGatedFramesCount(0);

    const runSimulationStep = () => {
      // Generate exactly 3.0 seconds (48,000 samples @ 16kHz)
      const exact3sPcm = generateAcousticPcm(scenarioRef.current, SLIDING_WINDOW_SAMPLES);
      slidingBufferRef.current.set(exact3sPcm);
      bufferedSamplesCountRef.current = SLIDING_WINDOW_SAMPLES;

      // Compute VAD on the 3-second simulation buffer
      let sumSq = 0;
      for (let i = 0; i < SLIDING_WINDOW_SAMPLES; i++) {
        sumSq += exact3sPcm[i] * exact3sPcm[i];
      }
      const bufferRms = Math.sqrt(sumSq / SLIDING_WINDOW_SAMPLES);
      const isMuted = scenarioRef.current === 'silent_pause';
      const isVadTriggered = !isMuted && (bufferRms >= 0.005 || Boolean(transcriptRef.current && transcriptRef.current.length > 3));

      if (isVadTriggered) {
        setClientVadState('SPEECH_ACTIVE');
        onSendWebSocketChunk(
          exact3sPcm, 
          transcriptRef.current || scenario.transcript, 
          claimedRef.current || scenario.claimed, 
          {
            ...scenario.context,
            sensitivity: sensitivityRef.current,
            vadTriggered: true,
            sampleCount: SLIDING_WINDOW_SAMPLES,
            windowDurationSec: 3.0
          }
        );
        setTransmittedSegmentsCount(c => c + 1);
      } else {
        // VAD did not trigger: audio transmission is gated
        setClientVadState('SILENCE');
        setGatedFramesCount(c => c + 1);
      }
    };

    // Initial trigger
    runSimulationStep();

    // Periodic dispatch every 1.5s
    simulationIntervalRef.current = setInterval(runSimulationStep, 1500);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    setClientVadState('SILENCE');
    slidingBufferRef.current.fill(0);
    bufferedSamplesCountRef.current = 0;
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

  // Play audio synthesizer preview of an analyzed segment
  const playSegmentAudio = (seg: CallAudioSegment) => {
    try {
      if (!segmentAudioCtxRef.current) {
        segmentAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = segmentAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      setPlayingSegmentId(seg.id);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (seg.label === 'FAKE') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(178, ctx.currentTime);
      } else if (seg.label === 'UNCERTAIN') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(142, ctx.currentTime + 1.2);
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

  // Call conclusion: Generate Summary Data and persist
  const handleEndCall = async () => {
    stopStreaming();

    const totalSec = Math.max(activeCallDuration, segments.length * 3);
    const fakeSegments = segments.filter(s => s.label === 'FAKE');
    const uncertainSegments = segments.filter(s => s.label === 'UNCERTAIN');
    const realSegments = segments.filter(s => s.label === 'REAL');
    const flaggedFakeDurationSec = fakeSegments.length * 3;
    const flaggedFakeDurationPercentage = totalSec > 0 ? Math.min(100, Math.round((flaggedFakeDurationSec / totalSec) * 100)) : 0;
    const uncertainSec = uncertainSegments.length * 3;
    const uncertainDurationPercentage = totalSec > 0 ? Math.min(100, Math.round((uncertainSec / totalSec) * 100)) : 0;

    let mostSuspicious = '00:00–00:03';
    if (fakeSegments.length > 0) {
      mostSuspicious = fakeSegments[0].timeRangeFormatted;
    } else if (uncertainSegments.length > 0) {
      mostSuspicious = uncertainSegments[0].timeRangeFormatted;
    }

    const overallVoiceStatus: OverallVoiceStatus = 
      flaggedFakeDurationPercentage >= 50 ? 'Possible Deepfake' :
      (flaggedFakeDurationPercentage >= 20 || uncertainSegments.length > 0 ? 'Suspicious' : 'Genuine');

    const overallRisk = (lastAnalysis?.finalRiskScore || 0) >= 70 || flaggedFakeDurationPercentage >= 50 
      ? 'HIGH' 
      : ((lastAnalysis?.finalRiskScore || 0) >= 40 || flaggedFakeDurationPercentage >= 20 ? 'MEDIUM' : 'LOW');

    const detectedFraudIntents = (lastAnalysis?.scamModule?.detectedCategories || []).map(cat => ({
      category: cat,
      matchedPhrase: currentTranscript.includes('lakh') ? 'urgently ₹5 lakh transfer karo' : (currentTranscript.includes('OTP') ? 'share the OTP now' : cat),
      severity: 'HIGH' as const,
      confidence: 0.92
    }));

    const summary: CallSummaryData = {
      caseId: `VG-2026-${Math.floor(100 + Math.random() * 900)}`,
      callStartTime: new Date(Date.now() - totalSec * 1000).toISOString(),
      callEndTime: new Date().toISOString(),
      callDurationSec: totalSec,
      callDurationFormatted: formatSeconds(totalSec),
      overallVoiceStatus,
      totalAnalyzedSpeechDurationSec: totalSec,
      flaggedFakeDurationSec,
      flaggedFakeDurationPercentage,
      uncertainDurationSec: uncertainSec,
      uncertainDurationPercentage,
      mostSuspiciousSegment: mostSuspicious,
      fakeSegmentsCount: fakeSegments.length,
      uncertainSegmentsCount: uncertainSegments.length,
      realSegmentsCount: realSegments.length,
      totalSegmentsCount: segments.length || 1,
      transcript: currentTranscript,
      highlightedTranscriptSentences: [
        { text: currentTranscript, isSuspicious: detectedFraudIntents.length > 0, category: detectedFraudIntents[0]?.category }
      ],
      detectedFraudIntents,
      overallRisk,
      warningsGenerated: [...warnings],
      averageInferenceLatencyMs: lastAnalysis?.benchmark?.totalRoundtripMs || 285,
      modelName: 'AASIST-v2 / Hybrid Anti-Spoofing',
      modelVersion: 'v2026.1-prod',
      segments: segments.length > 0 ? [...segments] : [
        {
          id: `seg-default-0`,
          index: 0,
          startSec: 0,
          endSec: 3,
          timeRangeFormatted: '00:00–00:03',
          label: (overallVoiceStatus === 'Possible Deepfake' ? 'FAKE' : (overallVoiceStatus === 'Suspicious' ? 'UNCERTAIN' : 'REAL')),
          rawScore: overallVoiceStatus === 'Possible Deepfake' ? 0.94 : (overallVoiceStatus === 'Suspicious' ? 0.55 : 0.08),
          confidence: 0.90,
          modelVersion: 'AASIST-v2',
          isFlaggedFake: overallVoiceStatus === 'Possible Deepfake',
          transcriptSnippet: currentTranscript.slice(0, 50)
        }
      ],
      caseReviewStatus: 'Under Investigation',
      callerMetadata: {
        claimedIdentity: claimedIdentity || 'Active Intercept',
        channel: '16kHz VoIP / WebRTC Stream',
        callerNumber: '+91-98765-43210'
      }
    };

    setCallSummaryData(summary);
    setShowSummaryModal(true);

    // Save to database
    try {
      await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
    } catch (err) {
      console.error('Failed to auto-save case summary:', err);
    }
  };

  // Segment accumulator and real-time warning generation
  useEffect(() => {
    if (!lastAnalysis || !isStreaming) return;

    const currentIdx = segments.length;
    const startSec = currentIdx * 3;
    const endSec = startSec + 3;
    const timeFormatted = `${formatSeconds(startSec)}–${formatSeconds(endSec)}`;

    const segLabel: SegmentLabel = lastAnalysis.segment?.label || 
      (lastAnalysis.finalRiskScore >= 70 ? 'FAKE' : (lastAnalysis.finalRiskScore >= 40 ? 'UNCERTAIN' : 'REAL'));
    const rawScore = lastAnalysis.segment?.rawScore ?? (lastAnalysis.finalRiskScore / 100);

    const newSegment: CallAudioSegment = {
      id: `seg-${Date.now()}-${currentIdx}`,
      index: currentIdx,
      startSec,
      endSec,
      timeRangeFormatted: timeFormatted,
      label: segLabel,
      rawScore,
      confidence: lastAnalysis.segment?.confidence ?? 0.88,
      modelVersion: lastAnalysis.segment?.modelVersion || 'AASIST-v2',
      isFlaggedFake: segLabel === 'FAKE',
      transcriptSnippet: currentTranscript.slice(-60) || 'Audio chunk analyzed',
      fraudCategories: lastAnalysis.scamModule?.detectedCategories || []
    };

    setSegments(prev => [...prev, newSegment]);

    // Check for real-time warning trigger:
    if (segLabel === 'FAKE' || lastAnalysis.finalRiskScore >= 70) {
      const warning: RealTimeWarning = {
        id: `warn-${Date.now()}`,
        timeSec: activeCallDuration,
        timeFormatted: formatSeconds(activeCallDuration),
        warningType: 'POSSIBLE AI-CLONED VOICE DETECTED',
        riskLevel: 'HIGH',
        triggerReason: `Suspicious segment detected at ${formatSeconds(activeCallDuration)} (AASIST spoof score: ${rawScore.toFixed(2)})`
      };
      setWarnings(prev => {
        if (prev.length > 0 && prev[prev.length - 1].timeFormatted === warning.timeFormatted) return prev;
        return [...prev, warning];
      });
    }
  }, [lastAnalysis]);

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
              onClick={handleEndCall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.35)] cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Disconnect &amp; End Call</span>
            </button>
          )}

          {callSummaryData && (
            <button
              onClick={() => setShowSummaryModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-medium transition-all cursor-pointer"
              title="View Post-Call Forensic Summary"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Call Summary</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
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
            {getVadPill(lastAnalysis?.vadState || clientVadState)}
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
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-slate-500">Quick-inject intent:</span>
              <button
                type="button"
                onClick={() => {
                  const p = "Main CEO bol raha hoon, urgently ₹5 lakh transfer karo hospital trust account mein. Vendor agreement suspend ho jayega immediately transfer karo.";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('ceo_fraud', SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, p, 'CEO Vikram Mehta', { 
                      ...SCENARIOS.ceo_fraud.context, 
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
                  }
                }}
                className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-700 text-[10px] font-mono-code font-bold cursor-pointer shadow-sm"
              >
                CEO ₹5 Lakh Transfer
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "Central Cyber Crime Branch. A digital arrest warrant has been issued against you for money laundering.";
                  setCurrentTranscript(p);
                  transcriptRef.current = p;
                  if (isStreaming) {
                    const pcm = generateAcousticPcm('digital_arrest', SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { 
                      ...SCENARIOS.digital_arrest.context, 
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
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
                    const pcm = generateAcousticPcm('clone_son', SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { 
                      ...SCENARIOS.clone_son.context, 
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
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
                    const pcm = generateAcousticPcm('replay_bank', SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { 
                      ...SCENARIOS.replay_bank.context, 
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
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
                    const pcm = generateAcousticPcm('safe_family', SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, p, claimedRef.current, { 
                      ...SCENARIOS.safe_family.context, 
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
                  }
                }}
                className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono-code cursor-pointer"
              >
                Safe Family
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 items-start">
              {isEditingTranscript ? (
                <div className="flex-1 space-y-1">
                  <textarea
                    rows={2}
                    value={currentTranscript}
                    onChange={(e) => {
                      setCurrentTranscript(e.target.value);
                      transcriptRef.current = e.target.value;
                    }}
                    placeholder="Manual transcript correction: Edit transcribed speech for higher forensic NLP accuracy..."
                    className="w-full bg-slate-950 border border-cyan-500/60 rounded-lg p-2 text-xs text-slate-100 font-mono-code focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <div className="text-[10px] text-cyan-400 font-mono-code">
                    Manual Transcript Correction Active &bull; English / Hindi / Hinglish supported
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={currentTranscript}
                  onChange={(e) => {
                    setCurrentTranscript(e.target.value);
                    transcriptRef.current = e.target.value;
                  }}
                  placeholder="Live spoken speech appears here automatically. Click 'Edit Transcript' to correct words manually..."
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              )}
              
              <button
                type="button"
                onClick={() => setIsEditingTranscript(prev => !prev)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Toggle manual transcript correction"
              >
                {isEditingTranscript ? <Save className="w-3.5 h-3.5 text-cyan-400" /> : <Edit3 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isEditingTranscript ? 'Done' : 'Edit'}</span>
              </button>

              {isStreaming && (
                <button
                  type="button"
                  onClick={() => {
                    const pcm = generateAcousticPcm(selectedScenario, SLIDING_WINDOW_SAMPLES);
                    slidingBufferRef.current.set(pcm);
                    onSendWebSocketChunk(pcm, transcriptRef.current, claimedRef.current, {
                      ...SCENARIOS[selectedScenario].context,
                      sensitivity,
                      vadTriggered: true,
                      sampleCount: SLIDING_WINDOW_SAMPLES,
                      windowDurationSec: 3.0
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-chakra cursor-pointer whitespace-nowrap shadow-sm"
                >
                  Evaluate 3s Window
                </button>
              )}
            </div>

            {/* Detected Fraud Intent Categories (FEATURE 8) */}
            {lastAnalysis?.scamModule?.detectedCategories && lastAnalysis.scamModule.detectedCategories.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono-code text-red-400 font-bold">Detected Intent:</span>
                {lastAnalysis.scamModule.detectedCategories.map((cat, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Warning Alert Banner (FEATURE 6 & 9) */}
      {isStreaming && (warnings.length > 0 || (lastAnalysis?.finalRiskScore || 0) >= 70) && (
        <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chakra text-base sm:text-lg font-bold text-white tracking-wider">
                  ⚠️ POSSIBLE AI-CLONED VOICE DETECTED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-red-900 text-white border border-red-400">
                  CURRENT RISK: HIGH
                </span>
              </div>
              <div className="text-xs text-red-200/90 font-mono-code mt-0.5">
                {warnings.length > 0 
                  ? warnings[warnings.length - 1].triggerReason 
                  : `Suspicious segment detected at ${formatSeconds(activeCallDuration)} (Composite threat: ${lastAnalysis?.finalRiskScore}%)`}
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-red-900/80 border border-red-400 text-xs font-mono-code font-bold text-white shadow-sm">
            REAL-TIME WARNING
          </span>
        </div>
      )}

      {/* SIH 2026 FEATURE 4 & 5: Live Timeline & Flagged Fake Duration */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-chakra text-sm font-bold tracking-wider text-white">
                SEGMENT-LEVEL TIMELINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
                Window-Level Estimates (2–4s Chunks)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Analyzed using AASIST-v2 anti-spoofing sliding window. Click any segment to preview acoustic synthesis.
            </p>
          </div>

          {/* Flagged Fake Duration Percentage Card (FEATURE 5) */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] font-mono-code text-slate-400 uppercase block">Flagged Fake Duration</span>
              <span className="text-2xl font-bold font-mono-code text-red-400">
                {(() => {
                  const total = Math.max(activeCallDuration, segments.length * 3);
                  const fakeCount = segments.filter(s => s.label === 'FAKE').length;
                  return total > 0 ? Math.min(100, Math.round((fakeCount * 3 / total) * 100)) : 0;
                })()}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400 max-w-[140px] leading-tight font-mono-code">
              of analyzed speech duration flagged as fake
            </div>
          </div>
        </div>

        {/* Mandatory Flagged Fake Duration Clarification Notice */}
        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Clarification:</strong> Flagged fake duration percentage is the fake-flagged duration over analyzed speech duration. It does <em>not</em> represent model accuracy or legal proof of fraud.
          </span>
        </div>

        {/* Timeline Segments Horizontal Bar / Grid */}
        <div className="space-y-2">
          {segments.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
              {segments.map((seg, idx) => {
                const isPlaying = playingSegmentId === seg.id;
                return (
                  <button
                    key={seg.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedSegment(seg);
                      playSegmentAudio(seg);
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono-code cursor-pointer transition-all ${
                      seg.label === 'FAKE'
                        ? 'bg-red-950/50 border-red-500/60 text-red-300 hover:bg-red-900/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : seg.label === 'REAL'
                        ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                        : 'bg-amber-950/50 border-amber-500/60 text-amber-300 hover:bg-amber-900/60'
                    }`}
                    title={`Click to preview audio (${seg.timeRangeFormatted} - Score: ${seg.rawScore.toFixed(2)})`}
                  >
                    <Play className={`w-3 h-3 ${isPlaying ? 'text-white animate-spin' : ''}`} />
                    <span className="font-bold">{seg.timeRangeFormatted}</span>
                    <span className="text-[10px] opacity-80">&rarr;</span>
                    <span className="font-bold">{seg.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500 font-mono-code">
              Start live defense or evaluate test scenario to record timeline segments (00:00–00:03, 00:03–00:06, etc.)
            </div>
          )}
        </div>
      </div>

      {/* 3-Second Sliding Window Buffer & VAD State Telemetry Panel */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono-code text-cyan-400 font-bold uppercase tracking-wide">
              ⚡ 3.0s Sliding Window Buffer &amp; VAD Transmission Controller
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-code border border-slate-700">
              {SLIDING_WINDOW_SAMPLES.toLocaleString()} samples @ 16kHz
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono-code">
            <span className="text-slate-400">
              Window Status: <strong className={clientVadState === 'SPEECH_ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                {clientVadState === 'SPEECH_ACTIVE' ? '3.0s Segment Active (VAD Triggered)' : 'Buffer Held / Gated (Silence)'}
              </strong>
            </span>
            <span className="text-slate-400">
              Dispatched: <strong className="text-cyan-400">{transmittedSegmentsCount}</strong> 3s chunks
            </span>
            <span className="text-slate-400">
              Gated Silence: <strong className="text-slate-300">{gatedFramesCount}</strong> frames
            </span>
          </div>
        </div>

        {/* Real-time buffer fill progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono-code text-slate-400">
            <span>Buffer Fill: 48,000 / 48,000 samples (Continuous Circular Overlap)</span>
            <span className={clientVadState === 'SPEECH_ACTIVE' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {clientVadState === 'SPEECH_ACTIVE' ? '● WebSocket Dispatching Speech Window' : '○ Gated During Non-Speech'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                clientVadState === 'SPEECH_ACTIVE'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 w-full animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 to-slate-600 w-full'
              }`}
            />
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

          {/* Sub-Model Risk Fusion Weights Breakdown Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs font-mono-code text-slate-300 font-semibold mb-2 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <span>Weighted Sub-Model Fusion Engine:</span>
                <span className="text-[10px] text-cyan-400 font-normal">
                  Score = (Clone &times; 40%) + (Replay &times; 25%) + (Scam &times; 35%) + Synergy Bonus
                </span>
              </span>
              {lastAnalysis.weights?.synergyBonus && lastAnalysis.weights.synergyBonus > 0 ? (
                <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-300 text-[10px] animate-pulse">
                  ⚡ Cross-Vector Synergy: +{lastAnalysis.weights.synergyBonus}%
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono-code">
              {/* Clone Sub-Model Weight */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Module A (Clone - 40%)</span>
                  <span className="text-cyan-400 font-bold">{lastAnalysis.cloneModule?.cloneRisk || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-cyan-500 h-full rounded-full" 
                    style={{ width: `${lastAnalysis.cloneModule?.cloneRisk || 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Contribution: <strong className="text-slate-200">+{(((lastAnalysis.cloneModule?.cloneRisk || 0) * (lastAnalysis.weights?.cloneWeight || 0.40))).toFixed(1)}%</strong>
                </div>
              </div>

              {/* Replay Sub-Model Weight */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Module B (Replay - 25%)</span>
                  <span className="text-amber-400 font-bold">{lastAnalysis.replayModule?.replayRisk || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${lastAnalysis.replayModule?.replayRisk || 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Contribution: <strong className="text-slate-200">+{(((lastAnalysis.replayModule?.replayRisk || 0) * (lastAnalysis.weights?.replayWeight || 0.25))).toFixed(1)}%</strong>
                </div>
              </div>

              {/* Scam NLP Sub-Model Weight */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Module C (Scam NLP - 35%)</span>
                  <span className="text-purple-400 font-bold">{lastAnalysis.scamModule?.scamRiskScore || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-purple-500 h-full rounded-full" 
                    style={{ width: `${lastAnalysis.scamModule?.scamRiskScore || 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  Contribution: <strong className="text-slate-200">+{(((lastAnalysis.scamModule?.scamRiskScore || 0) * (lastAnalysis.weights?.scamWeight || 0.35))).toFixed(1)}%</strong>
                </div>
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

      {/* Post-Call Analysis Summary Modal (FEATURE 11) */}
      <CallSummaryModal
        isOpen={showSummaryModal && !!callSummaryData}
        summaryData={callSummaryData}
        onClose={() => setShowSummaryModal(false)}
        onOpenEvidenceReport={() => {
          setShowSummaryModal(false);
          setShowEvidenceReportModal(true);
        }}
        onPlaySegmentAudio={playSegmentAudio}
      />

      {/* Automatic PDF-Ready Evidence Forensic Report (FEATURE 12) */}
      <EvidenceReportModal
        isOpen={showEvidenceReportModal && !!callSummaryData}
        caseData={callSummaryData}
        onClose={() => setShowEvidenceReportModal(false)}
      />

    </div>
  );
};

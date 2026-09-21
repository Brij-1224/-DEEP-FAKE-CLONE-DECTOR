/**
 * VeriShield AI — Core Type Definitions
 * Real-time Voice Clone, Replay Spoof & Scam Detection Architecture
 */

export type VadState = 'SPEECH_ACTIVE' | 'SILENCE' | 'AMBIENT_NOISE';

export type ThreatVerdict = 
  | 'GENUINE_HUMAN'
  | 'LOW_SUSPICION'
  | 'SUSPICIOUS_ANOMALY'
  | 'HIGH_RISK_DEEPFAKE'
  | 'ACTIVE_SCAM_ATTACK';

export type ScamSignalLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AudioDspFeatures {
  rmsEnergy: number;                 // Root Mean Square energy (0-1)
  zeroCrossingRate: number;          // ZCR (noisiness / unvoiced speech)
  spectralCentroid: number;          // Brightness of sound (Hz)
  spectralRolloff: number;           // High-frequency energy cutoff (Hz)
  spectralFlux: number;              // Rate of spectral change
  pitchHz: number;                   // Fundamental frequency F0
  pitchStability: number;            // Pitch variance (synthetic voices are unnaturally flat)
  harmonicToNoiseRatio: number;      // HNR in dB
  loudspeakerPeakRatio: number;      // 1.8kHz - 3.2kHz energy ratio (replay phone speaker signature)
  highFreqCutoffArtifact: boolean;   // Typical 8kHz / 16kHz neural vocoder sharp shelf
  vocoderPhaseDispersion: number;    // Phase incongruity characteristic of neural synthesis
}

export interface DeepfakeDetectionModule {
  cloneRisk: number;                 // 0 - 100%
  confidence: number;                // 0 - 100%
  vocoderArtifactScore: number;      // 0 - 100%
  detectedArchitecture: string;      // e.g. "HiFi-GAN / WaveGlow vocoder signature"
  phaseConsistency: 'NATURAL' | 'SYNTHETIC_ANOMALY';
  spectralBandGap: boolean;
  microTremorDetected: boolean;
  notes: string;
}

export interface ReplayDetectionModule {
  replayRisk: number;                // 0 - 100%
  loudspeakerResonance: number;      // 0 - 100%
  roomImpulseDelay: number;          // Estimated secondary reflection in ms
  dynamicRangeCompression: number;  // 0 - 100%
  verdict: 'DIRECT_MICROPHONE' | 'LOUDSPEAKER_PLAYBACK' | 'SUSPECTED_REPLAY';
  details: string;
}

export interface ScamLanguageModule {
  scamSignal: ScamSignalLevel;
  scamRiskScore: number;             // 0 - 100%
  transcript: string;
  detectedCategories: string[];      // e.g. ["Digital Arrest", "OTP Request", "Urgent Wire", "Family Distress"]
  urgencyScore: number;              // 0 - 100%
  intimidationScore: number;         // 0 - 100%
  keyPhrases: string[];
}

export interface SpeakerVerificationModule {
  enrolledName: string | null;       // e.g. "Arjun (Son)"
  similarityScore: number;           // 0 - 100% (cosine similarity of voice embedding)
  impersonationAlert: boolean;       // Alert if claimed identity does not match voice embedding
  targetPitchDeltaHz: number;
}

export interface LatencyBenchmark {
  bufferingMs: number;               // 1-3 sec sliding window accumulation
  preprocessingMs: number;           // 16kHz resample, VAD, FFT (< 100ms)
  inferenceMs: number;               // Acoustic ML + Scam NLP (< 300ms)
  riskFusionMs: number;              // Multi-signal Bayesian fusion (< 50ms)
  totalRoundtripMs: number;          // End-to-end latency (~250-450ms)
  timestamp: number;
}

export interface LiveAnalysisResult {
  id: string;
  timestamp: string;
  vadState: VadState;
  verdict: ThreatVerdict;
  finalRiskScore: number;            // 0 - 100%
  confidence: number;
  cloneModule: DeepfakeDetectionModule;
  replayModule: ReplayDetectionModule;
  scamModule: ScamLanguageModule;
  speakerModule: SpeakerVerificationModule;
  latency: LatencyBenchmark;
  benchmark?: LatencyBenchmark;
  features: AudioDspFeatures;
  recommendedAction: string;
}

export interface EnrolledSpeaker {
  id: string;
  name: string;
  relation: string;
  enrollmentDate: string;
  baselinePitchHz: number;
  pitchRangeHz: [number, number];
  spectralSignatureVector: number[];
  sampleAudioDurationSec: number;
}

export interface ActiveLivenessChallenge {
  challengeId: string;
  promptPhrase: string;              // e.g. "Blue mango 47"
  generatedAt: number;
  expiresAt: number;
  status: 'PENDING' | 'VERIFIED' | 'FAILED_SPOOF' | 'EXPIRED';
  matchedText?: string;
  acousticLivenessScore?: number;
  similarityToPrompt?: number;
}

export interface AnalysisLogEntry {
  id: string;
  type: 'LIVE_STREAM' | 'SIMULATED_CALL' | 'AUDIO_UPLOAD' | 'LIVENESS_CHALLENGE' | 'PHOTO_SCAN';
  filename: string;
  verdict: ThreatVerdict | 'AI_GENERATED' | 'REAL_AUTHENTIC_PHOTO' | 'HIGHLY_SUSPICIOUS_SYNTHETIC' | 'HEAVILY_EDITED_MANIPULATED';
  aiRisk: number;
  replayRisk: number;
  scamDetected: boolean;
  scamCategories: string[];
  callerIdentity: string;
  timestamp: string;
  latencyMs: number;
  details?: string;
}

export type PhotoVerdict = 'AI_GENERATED' | 'REAL_AUTHENTIC_PHOTO' | 'HIGHLY_SUSPICIOUS_SYNTHETIC' | 'HEAVILY_EDITED_MANIPULATED';

export interface PhotoAnomaly {
  category: 'ANATOMY' | 'LIGHTING_PHYSICS' | 'TEXTURE_NOISE' | 'DIFFUSION_ARTIFACT' | 'SEMANTIC_GEOMETRY';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  location?: string;
}

export interface PhotoForensicResult {
  id: string;
  caseNumber: string;
  timestamp: string;
  filename: string;
  imageDimensions?: { width: number; height: number };
  verdict: PhotoVerdict;
  aiGeneratedProbability: number; // 0 - 100%
  realPhotoProbability: number;      // 0 - 100%
  confidence: number;                // 0 - 100%
  estimatedGenerator: string;        // e.g. "Midjourney v6.1", "Flux.1", "DALL-E 3", "Camera Sensor (Real)"
  metrics: {
    anatomicalBiologicalScore: number;     // 0-100 (high = artificial/abnormal)
    lightingOpticsScore: number;           // 0-100 (high = physical mismatch/inconsistent)
    compressionSensorNoiseScore: number;   // 0-100 (high = missing sensor noise / synthetic smoothing)
    frequencyArtifactScore: number;        // 0-100 (high = diffusion grid / checkerboard artifacts)
    semanticPhysicsScore: number;          // 0-100 (high = impossible geometry / nonsensical elements)
  };
  detectedAnomalies: PhotoAnomaly[];
  keyFindings: string[];
  forensicSummary: string;
  courtEvidenceDeclaration: string;
  elaImageDataUrl?: string;
  noiseMapDataUrl?: string;
  thumbnailUrl?: string;
  imageBase64?: string;
  exifData?: {
    hasExif: boolean;
    cameraMake?: string;
    cameraModel?: string;
    software?: string;
    lens?: string;
    iso?: string | number;
    exposureTime?: string;
    fNumber?: string | number;
    dateTimeOriginal?: string;
    aiSignaturesDetected?: string[];
  };
}


export interface DeepForensicReport {
  id: string;
  caseNumber: string;
  createdAt: string;
  audioDurationSec: number;
  verdict: ThreatVerdict;
  overallScore: number;
  thinkingProcess?: string;
  vocoderAnalysis: {
    spectralCutoff: string;
    phaseArtifacts: string;
    glottalPulseRegularity: string;
    estimatedModelFamily: string;
  };
  acousticForensics: {
    roomImpulseEcho: string;
    transducerSignature: string;
    backgroundNoiseContinuity: string;
  };
  linguisticForensics: {
    coercionTactics: string[];
    psychologicalPressureScore: number;
    syntacticCadence: string;
  };
  courtEvidenceSummary: string;
}

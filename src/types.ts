/**
 * TruthNet: VoiceGuard AI — Core Type Definitions
 * Real-Time Voice Cloning Detection, Fraud Intent Analysis & Investigation System (SIH 2026)
 */

export type VadState = 'SPEECH_ACTIVE' | 'SILENCE' | 'AMBIENT_NOISE';

export type ThreatVerdict = 
  | 'GENUINE_HUMAN'
  | 'LOW_SUSPICION'
  | 'SUSPICIOUS_ANOMALY'
  | 'HIGH_RISK_DEEPFAKE'
  | 'ACTIVE_SCAM_ATTACK';

export type ScamSignalLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SegmentLabel = 'REAL' | 'FAKE' | 'UNCERTAIN' | 'MODEL_UNAVAILABLE';

export type OverallVoiceStatus = 
  | 'Genuine'
  | 'Suspicious'
  | 'Possible Deepfake'
  | 'Under Investigation'
  | 'Confirmed only after authorized human review';

export type CaseOutcomeStatus = 
  | 'Under Investigation'
  | 'Confirmed Deepfake'
  | 'False Positive'
  | 'Genuine';

export interface CallAudioSegment {
  id: string;
  index: number;
  startSec: number;
  endSec: number;
  timeRangeFormatted: string; // e.g. "00:00–00:04"
  label: SegmentLabel;
  rawScore: number;           // 0.0 - 1.0 (AASIST anti-spoofing score)
  confidence: number;         // 0 - 100%
  modelVersion: string;       // e.g. "AASIST-v2 (Pretrained Anti-Spoofing)"
  audioPcm?: number[];        // PCM samples for in-browser playback
  audioSnippetUrl?: string;   // Data URL or wave audio
  transcriptSnippet?: string; // Text spoken during this window
  suspiciousKeywords?: string[];
  fraudCategories?: string[];
  replayScore?: number;
  isFlaggedFake: boolean;     // Flagged as fake window
}

export interface RealTimeWarning {
  id: string;
  timeSec: number;
  timeFormatted: string;      // e.g. "00:41"
  warningType: string;        // e.g. "POSSIBLE AI-CLONED VOICE DETECTED"
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  triggerReason: string;      // e.g. "Consecutive fake-flagged speech segments detected"
  detectedIntent?: string;
}

export interface CallSummaryData {
  caseId: string;             // e.g. "VG-2026-001"
  callStartTime: string;
  callEndTime: string;
  callDurationSec: number;
  callDurationFormatted: string; // e.g. "01:28"
  overallVoiceStatus: OverallVoiceStatus;
  totalAnalyzedSpeechDurationSec: number;
  flaggedFakeDurationSec: number;
  flaggedFakeDurationPercentage: number; // Formula: (Fake-flagged duration / Total analyzed duration) * 100
  uncertainDurationSec: number;
  uncertainDurationPercentage: number;
  mostSuspiciousSegment: string; // e.g. "00:08–00:16"
  fakeSegmentsCount: number;
  realSegmentsCount: number;
  uncertainSegmentsCount: number;
  totalSegmentsCount: number;
  transcript: string;
  highlightedTranscriptSentences: Array<{
    text: string;
    isSuspicious: boolean;
    category?: string;
  }>;
  detectedFraudIntents: Array<{
    category: string;
    matchedPhrase: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  warningsGenerated: RealTimeWarning[];
  averageInferenceLatencyMs: number;
  modelName: string;
  modelVersion: string;
  caseReviewStatus: CaseOutcomeStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  callerMetadata?: {
    callerNumber?: string;
    claimedIdentity?: string;
    channel?: string;
  };
  segments: CallAudioSegment[];
}

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
  pitchJitterRatio?: number;         // Cycle-to-cycle relative jitter (human ~0.008-0.035)
  shimmerRatio?: number;             // Amplitude cycle-to-cycle perturbation (human ~0.02-0.06)
  f0StdDev?: number;                 // F0 standard deviation across voiced frames
  f0Cv?: number;                     // F0 coefficient of variation
  biologicalGlottalScore?: number;   // 0-100 score indicating biological vocal cord health
}

export interface DeepfakeDetectionModule {
  cloneRisk: number;                 // 0 - 100%
  confidence: number;                // 0 - 100%
  vocoderArtifactScore: number;      // 0 - 100%
  detectedArchitecture: string;      // e.g. "AASIST-v2 Graph Attention Network + Sinc-Conv"
  phaseConsistency: 'NATURAL' | 'SYNTHETIC_ANOMALY';
  spectralBandGap: boolean;
  microTremorDetected: boolean;
  notes: string;
  aasistRawProbability?: number;     // 0.0 - 1.0 probability from graph attention
  lfccSpectralSpikes?: number;       // Number of anomalous LFCC filterbank spikes
  graphAttentionSaliency?: number;   // Cross-band spectral attention score
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
  conversationLevelThreat?: number;  // 0 - 100% multi-turn cumulative threat
  conversationTacticsSequence?: string[]; // Tactics tracked across conversational progression
  multiTurnEscalationDetected?: boolean;
}

export interface SpeakerVerificationModule {
  enrolledName: string | null;       // e.g. "Arjun (Son)"
  similarityScore: number;           // 0 - 100% (cosine similarity of voice embedding)
  impersonationAlert: boolean;       // Alert if claimed identity does not match voice embedding
  targetPitchDeltaHz: number;
  cosineSimilarity?: number;         // Mathematical cosine similarity (-1.0 to 1.0)
  embeddingDimensionality?: number;  // 128-D ECAPA-TDNN embedding vector
}

export interface LatencyBenchmark {
  bufferingMs: number;               // 1-3 sec sliding window accumulation
  preprocessingMs: number;           // 16kHz resample, VAD, FFT (< 100ms)
  inferenceMs: number;               // Acoustic ML + Scam NLP (< 300ms)
  riskFusionMs: number;              // Multi-signal Bayesian fusion (< 50ms)
  totalRoundtripMs: number;          // End-to-end latency (~250-450ms)
  timestamp: number;
  captureMs?: number;
  networkUpMs?: number;
  networkDownMs?: number;
  renderMs?: number;
}

export interface SubModelWeights {
  cloneWeight: number;    // e.g. 0.50 (50% AASIST/RawNet2)
  dspWeight?: number;     // e.g. 0.20 (20% DSP)
  replayWeight: number;   // e.g. 0.15 (15%)
  scamWeight: number;     // e.g. 0.15 (15%)
  crossCorrelationBonus?: number; // Synergistic threat boost when multiple vectors are elevated
  synergyBonus?: number;          // Alias for cross-correlation bonus
  sensitivityMultiplier?: number;
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
  weights?: SubModelWeights;
  segment?: CallAudioSegment;
  overallVoiceStatus?: OverallVoiceStatus;
  slidingWindowStats?: {
    windowDurationSec: number;
    sampleCount: number;
    vadTriggered: boolean;
  };
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
  embeddingVector?: number[];
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
  type: 'LIVE_STREAM' | 'SIMULATED_CALL' | 'AUDIO_UPLOAD' | 'LIVENESS_CHALLENGE' | 'PHOTO_SCAN' | 'VIDEO_SCAN';
  filename: string;
  verdict: ThreatVerdict | PhotoVerdict | VideoVerdict;
  aiRisk: number;
  replayRisk: number;
  scamDetected: boolean;
  scamCategories: string[];
  callerIdentity: string;
  timestamp: string;
  latencyMs: number;
  details?: string;
}

export type VideoVerdict = 
  | 'DEEPFAKE_VIDEO' 
  | 'AUTHENTIC_REAL_VIDEO' 
  | 'SUSPECTED_FACE_SWAP' 
  | 'AI_LIP_SYNC_MANIPULATION';

export interface VideoAnomaly {
  category: 'FACIAL_BORDER' | 'BLINK_DYNAMICS' | 'LIP_SYNC' | 'TEMPORAL_FLICKER' | 'DIFFUSION_TEXTURE';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  timestampSec?: number;
  frameIndex?: number;
  location?: string;
}

export interface VideoFrameTimelinePoint {
  frame: number;
  timeSec: number;
  fakeScore: number;
  blinkDetected: boolean;
  lipSyncDeltaMs?: number;
  mouthOpening: number;
  anomalyDetected?: boolean;
}

export interface VideoForensicResult {
  id: string;
  caseNumber: string;
  timestamp: string;
  filename: string;
  videoDurationSec: number;
  fps: number;
  totalFramesAnalyzed: number;
  verdict: VideoVerdict;
  deepfakeProbability: number;     // 0 - 100%
  realVideoProbability: number;        // 0 - 100%
  confidence: number;                  // 0 - 100%
  estimatedGenerator: string;          // e.g. "DeepFaceLab / Roop Face-Swap", "Wav2Lip / SadTalker", "Sora / Kling Diffusion", "Authentic Camera"
  metrics: {
    facialBorderBlendingScore: number;   // 0-100 (high = seam artifacts / mask warping)
    eyeBlinkPhysiologyScore: number;     // 0-100 (high = abnormal/missing blinks or frozen pupils)
    lipSyncAudioVisualScore: number;     // 0-100 (high = desynchronized mouth visemes)
    temporalFlickerScore: number;        // 0-100 (high = frame-to-frame jitter / morphing)
    skinTextureSmoothingScore: number;   // 0-100 (high = plastic skin / missing pore noise)
  };
  detectedAnomalies: VideoAnomaly[];
  frameTimeline: VideoFrameTimelinePoint[];
  keyFindings: string[];
  forensicSummary: string;
  courtEvidenceDeclaration: string;
  thumbnailUrl?: string;
  sampleFrameUrls?: string[];
  audioTrackDetected?: boolean;
  audioAnalysis?: LiveAnalysisResult;
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

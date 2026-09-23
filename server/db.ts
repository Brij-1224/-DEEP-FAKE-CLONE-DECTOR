/**
 * VeriShield AI — Incident Database & Enrolled Speaker Store
 */

import { AnalysisLogEntry, EnrolledSpeaker, ActiveLivenessChallenge, PhotoForensicResult, VideoForensicResult, CallSummaryData } from '../src/types';

// Seeded investigation cases for SIH 2026 VoiceGuard AI demonstrations
let callSummaries: CallSummaryData[] = [
  {
    caseId: 'VG-2026-001',
    callStartTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    callEndTime: new Date(Date.now() - 1000 * 60 * 33).toISOString(),
    callDurationSec: 120,
    callDurationFormatted: '02:00',
    overallVoiceStatus: 'Possible Deepfake',
    totalAnalyzedSpeechDurationSec: 100,
    flaggedFakeDurationSec: 72,
    flaggedFakeDurationPercentage: 72, // 72% of analyzed speech duration flagged as fake
    uncertainDurationSec: 12,
    uncertainDurationPercentage: 12,
    mostSuspiciousSegment: '00:08–00:16',
    fakeSegmentsCount: 6,
    realSegmentsCount: 2,
    uncertainSegmentsCount: 1,
    totalSegmentsCount: 9,
    transcript: 'Main CEO bol raha hoon, urgently ₹5 lakh transfer karo hospital trust account mein. Vendor agreement suspend ho jayega immediately transfer karo.',
    highlightedTranscriptSentences: [
      { text: 'Main CEO bol raha hoon, ', isSuspicious: true, category: 'IDENTITY IMPERSONATION' },
      { text: 'urgently ₹5 lakh transfer karo ', isSuspicious: true, category: 'URGENT TRANSFER' },
      { text: 'hospital trust account mein. ', isSuspicious: false },
      { text: 'Vendor agreement suspend ho jayega immediately transfer karo.', isSuspicious: true, category: 'PAYMENT REQUEST' }
    ],
    detectedFraudIntents: [
      { category: 'IDENTITY IMPERSONATION', matchedPhrase: 'Main CEO bol raha hoon', severity: 'HIGH' },
      { category: 'URGENT TRANSFER', matchedPhrase: 'urgently ₹5 lakh transfer karo', severity: 'HIGH' },
      { category: 'PAYMENT REQUEST', matchedPhrase: 'immediately transfer karo', severity: 'HIGH' }
    ],
    overallRisk: 'HIGH',
    warningsGenerated: [
      {
        id: 'warn-1',
        timeSec: 12,
        timeFormatted: '00:12',
        warningType: 'POSSIBLE AI-CLONED VOICE DETECTED',
        riskLevel: 'HIGH',
        triggerReason: 'Consecutive fake speech segments detected with urgent CEO transfer demand',
        detectedIntent: 'URGENT TRANSFER'
      }
    ],
    averageInferenceLatencyMs: 285,
    modelName: 'AASIST-v2 / Hybrid Anti-Spoofing',
    modelVersion: 'v2026.1-prod',
    caseReviewStatus: 'Under Investigation',
    callerMetadata: {
      callerNumber: '+91 98201 XXXXX',
      claimedIdentity: 'CEO Vikram Mehta',
      channel: 'VoIP SIP Gateway'
    },
    segments: [
      {
        id: 'seg-1',
        index: 1,
        startSec: 0,
        endSec: 4,
        timeRangeFormatted: '00:00–00:04',
        label: 'REAL',
        rawScore: 0.18,
        confidence: 94,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'Hello, can you hear me properly?',
        fraudCategories: [],
        suspiciousKeywords: [],
        isFlaggedFake: false
      },
      {
        id: 'seg-2',
        index: 2,
        startSec: 4,
        endSec: 8,
        timeRangeFormatted: '00:04–00:08',
        label: 'UNCERTAIN',
        rawScore: 0.48,
        confidence: 76,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'Main CEO bol raha hoon,',
        fraudCategories: ['IDENTITY IMPERSONATION'],
        suspiciousKeywords: ['Main CEO bol raha hoon'],
        isFlaggedFake: false
      },
      {
        id: 'seg-3',
        index: 3,
        startSec: 8,
        endSec: 12,
        timeRangeFormatted: '00:08–00:12',
        label: 'FAKE',
        rawScore: 0.94,
        confidence: 96,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'urgently ₹5 lakh transfer karo',
        fraudCategories: ['URGENT TRANSFER', 'PAYMENT REQUEST'],
        suspiciousKeywords: ['urgently ₹5 lakh transfer karo'],
        isFlaggedFake: true
      },
      {
        id: 'seg-4',
        index: 4,
        startSec: 12,
        endSec: 16,
        timeRangeFormatted: '00:12–00:16',
        label: 'FAKE',
        rawScore: 0.96,
        confidence: 97,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'hospital trust account mein. immediately transfer karo.',
        fraudCategories: ['PAYMENT REQUEST'],
        suspiciousKeywords: ['immediately transfer karo'],
        isFlaggedFake: true
      }
    ]
  },
  {
    caseId: 'VG-2026-002',
    callStartTime: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    callEndTime: new Date(Date.now() - 1000 * 60 * 91).toISOString(),
    callDurationSec: 240,
    callDurationFormatted: '04:00',
    overallVoiceStatus: 'Suspicious',
    totalAnalyzedSpeechDurationSec: 180,
    flaggedFakeDurationSec: 115,
    flaggedFakeDurationPercentage: 64, // 64% flagged fake duration
    uncertainDurationSec: 25,
    uncertainDurationPercentage: 14,
    mostSuspiciousSegment: '00:24–00:36',
    fakeSegmentsCount: 8,
    realSegmentsCount: 4,
    uncertainSegmentsCount: 2,
    totalSegmentsCount: 14,
    transcript: 'Central Cyber Crime Branch Inspector Vijay Rathore. Illegal parcel seized with drugs under your Aadhaar. Digital arrest warrant nikla hai, phone mat kaatna turant safe account mein penalty pay karo.',
    highlightedTranscriptSentences: [
      { text: 'Central Cyber Crime Branch Inspector Vijay Rathore. ', isSuspicious: true, category: 'IDENTITY IMPERSONATION' },
      { text: 'Illegal parcel seized with drugs under your Aadhaar. ', isSuspicious: true, category: 'CONFIDENTIAL DATA REQUEST' },
      { text: 'Digital arrest warrant nikla hai, phone mat kaatna ', isSuspicious: true, category: 'IDENTITY IMPERSONATION' },
      { text: 'turant safe account mein penalty pay karo.', isSuspicious: true, category: 'PAYMENT REQUEST' }
    ],
    detectedFraudIntents: [
      { category: 'IDENTITY IMPERSONATION', matchedPhrase: 'Inspector Vijay Rathore / digital arrest', severity: 'HIGH' },
      { category: 'CONFIDENTIAL DATA REQUEST', matchedPhrase: 'Aadhaar details', severity: 'MEDIUM' },
      { category: 'PAYMENT REQUEST', matchedPhrase: 'penalty pay karo', severity: 'HIGH' },
      { category: 'BANK ACCOUNT CHANGE', matchedPhrase: 'safe account mein', severity: 'HIGH' }
    ],
    overallRisk: 'HIGH',
    warningsGenerated: [
      {
        id: 'warn-2',
        timeSec: 36,
        timeFormatted: '00:36',
        warningType: 'POSSIBLE AI-CLONED VOICE DETECTED',
        riskLevel: 'HIGH',
        triggerReason: 'Digital Arrest authority impersonation and synthetic pitch lock',
        detectedIntent: 'IDENTITY IMPERSONATION'
      }
    ],
    averageInferenceLatencyMs: 310,
    modelName: 'AASIST-v2 / Hybrid Anti-Spoofing',
    modelVersion: 'v2026.1-prod',
    caseReviewStatus: 'Confirmed Deepfake',
    reviewedBy: 'Inspector A. Verma (Cyber Cell)',
    reviewedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    reviewerNotes: 'AASIST model confirmed severe vocoder cutoff above 7.2kHz. Coercive digital arrest scam detected. Fraud UPI frozen.',
    callerMetadata: {
      callerNumber: '+91 88392 XXXXX',
      claimedIdentity: 'Fake CBI Officer',
      channel: 'WhatsApp Cellular Spoof'
    },
    segments: [
      {
        id: 'seg-201',
        index: 1,
        startSec: 0,
        endSec: 4,
        timeRangeFormatted: '00:00–00:04',
        label: 'REAL',
        rawScore: 0.22,
        confidence: 90,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'Listening on line...',
        isFlaggedFake: false
      },
      {
        id: 'seg-202',
        index: 2,
        startSec: 4,
        endSec: 8,
        timeRangeFormatted: '00:04–00:08',
        label: 'FAKE',
        rawScore: 0.91,
        confidence: 95,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'Central Cyber Crime Branch Inspector Vijay Rathore.',
        fraudCategories: ['IDENTITY IMPERSONATION'],
        isFlaggedFake: true
      }
    ]
  },
  {
    caseId: 'VG-2026-003',
    callStartTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    callEndTime: new Date(Date.now() - 1000 * 60 * 178).toISOString(),
    callDurationSec: 90,
    callDurationFormatted: '01:30',
    overallVoiceStatus: 'Genuine',
    totalAnalyzedSpeechDurationSec: 80,
    flaggedFakeDurationSec: 0,
    flaggedFakeDurationPercentage: 0, // 0% flagged fake
    uncertainDurationSec: 5,
    uncertainDurationPercentage: 6,
    mostSuspiciousSegment: 'None',
    fakeSegmentsCount: 0,
    realSegmentsCount: 8,
    uncertainSegmentsCount: 1,
    totalSegmentsCount: 9,
    transcript: 'Hey mom, just checking in. Leaving office now, picking up groceries. Will see you at dinner!',
    highlightedTranscriptSentences: [
      { text: 'Hey mom, just checking in. Leaving office now, picking up groceries. Will see you at dinner!', isSuspicious: false }
    ],
    detectedFraudIntents: [],
    overallRisk: 'LOW',
    warningsGenerated: [],
    averageInferenceLatencyMs: 240,
    modelName: 'AASIST-v2 / Hybrid Anti-Spoofing',
    modelVersion: 'v2026.1-prod',
    caseReviewStatus: 'Genuine',
    reviewedBy: 'Authorized System Check',
    reviewedAt: new Date(Date.now() - 1000 * 60 * 177).toISOString(),
    reviewerNotes: 'Verified organic human pitch micro-tremors (jitter 2.1%, shimmer 3.8%). Natural glottal phonation verified.',
    callerMetadata: {
      callerNumber: '+91 97110 XXXXX',
      claimedIdentity: 'Son Arjun Sharma',
      channel: 'Mobile PSTN'
    },
    segments: [
      {
        id: 'seg-301',
        index: 1,
        startSec: 0,
        endSec: 4,
        timeRangeFormatted: '00:00–00:04',
        label: 'REAL',
        rawScore: 0.08,
        confidence: 98,
        modelVersion: 'AASIST-v2 / Hybrid Anti-Spoofing',
        transcriptSnippet: 'Hey mom, just checking in.',
        isFlaggedFake: false
      }
    ]
  }
];

// In-memory persistent state (seeded with realistic SIH demonstration cases)
let analysisLogs: AnalysisLogEntry[] = [
  {
    id: 'log-001',
    type: 'SIMULATED_CALL',
    filename: 'call_intercept_cbi_threat_01.wav',
    verdict: 'ACTIVE_SCAM_ATTACK',
    aiRisk: 92,
    replayRisk: 78,
    scamDetected: true,
    scamCategories: ['Digital Arrest / Fake Law Enforcement', 'Secrecy & Intimidation'],
    callerIdentity: 'Claimed: CBI Inspector R. Sharma',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    latencyMs: 318,
    details: 'Digital arrest fraud. Demanded Rs. 2,50,000 transfer to avoid arrest warrant.'
  },
  {
    id: 'log-002',
    type: 'AUDIO_UPLOAD',
    filename: 'family_emergency_voice_clone.mp3',
    verdict: 'HIGH_RISK_DEEPFAKE',
    aiRisk: 96,
    replayRisk: 42,
    scamDetected: true,
    scamCategories: ['Family Impersonation / Distress', 'Urgent Wire / Emergency Ransom'],
    callerIdentity: 'Claimed: Arjun (Son)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    latencyMs: 295,
    details: 'AI voice clone of son claiming road accident and requesting hospital funds.'
  },
  {
    id: 'log-003',
    type: 'LIVE_STREAM',
    filename: 'live_mic_verification_pass.pcm',
    verdict: 'GENUINE_HUMAN',
    aiRisk: 8,
    replayRisk: 11,
    scamDetected: false,
    scamCategories: [],
    callerIdentity: 'Priya (Wife)',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    latencyMs: 242,
    details: 'Verified organic human speech. Biometric pitch jitter 2.4%, natural formant decay.'
  },
  {
    id: 'log-005',
    type: 'PHOTO_SCAN',
    filename: 'midjourney_v6_deepfake_evidence.jpg',
    verdict: 'AI_GENERATED',
    aiRisk: 98,
    replayRisk: 89,
    scamDetected: true,
    scamCategories: ['AI Generated Photo / Synthetic Media'],
    callerIdentity: 'Midjourney v6.1 Synthetic Diffusion',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    latencyMs: 310,
    details: 'Microscopic plastic dermal smoothing and dual corneal catchlights violating ray optics.'
  },
  {
    id: 'log-004',
    type: 'SIMULATED_CALL',
    filename: 'bank_kyc_otp_replay.wav',
    verdict: 'SUSPECTED_REPLAY' as any,
    aiRisk: 52,
    replayRisk: 88,
    scamDetected: true,
    scamCategories: ['OTP & Financial Credential Coercion'],
    callerIdentity: 'Claimed: HDFC Bank Fraud Dept',
    timestamp: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    latencyMs: 330,
    details: 'Secondary loudspeaker playback detected with 2.2 kHz transducer resonance.'
  }
];

let enrolledSpeakers: EnrolledSpeaker[] = [
  {
    id: 'spk-01',
    name: 'Arjun Sharma',
    relation: 'Son',
    enrollmentDate: '2026-08-15',
    baselinePitchHz: 124,
    pitchRangeHz: [95, 160],
    spectralSignatureVector: [0.12, 0.45, 0.78, 0.33, 0.19],
    sampleAudioDurationSec: 15.0
  },
  {
    id: 'spk-02',
    name: 'Priya Sharma',
    relation: 'Wife',
    enrollmentDate: '2026-08-18',
    baselinePitchHz: 215,
    pitchRangeHz: [170, 260],
    spectralSignatureVector: [0.35, 0.62, 0.91, 0.44, 0.28],
    sampleAudioDurationSec: 12.5
  },
  {
    id: 'spk-03',
    name: 'Vikram Mehta',
    relation: 'Managing Director / CEO',
    enrollmentDate: '2026-09-02',
    baselinePitchHz: 110,
    pitchRangeHz: [85, 145],
    spectralSignatureVector: [0.18, 0.39, 0.65, 0.29, 0.15],
    sampleAudioDurationSec: 20.0
  }
];

let activeChallenges: Map<string, ActiveLivenessChallenge> = new Map();

let photoHistory: PhotoForensicResult[] = [
  {
    id: 'photo-seed-01',
    caseNumber: 'IMG-CASE-948211',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    filename: 'ai_midjourney_portrait_test.jpg',
    verdict: 'AI_GENERATED',
    aiGeneratedProbability: 98.2,
    realPhotoProbability: 1.8,
    confidence: 97,
    estimatedGenerator: 'Midjourney v6.1 Photoreal',
    metrics: {
      anatomicalBiologicalScore: 94,
      lightingOpticsScore: 88,
      compressionSensorNoiseScore: 92,
      frequencyArtifactScore: 89,
      semanticPhysicsScore: 82
    },
    detectedAnomalies: [
      {
        category: 'TEXTURE_NOISE',
        title: 'Missing CMOS Poisson Sensor Noise',
        description: 'Skin lacks microscopic papillary dermal pores and natural photon shot noise.',
        severity: 'CRITICAL',
        location: 'Facial cheek and forehead zone'
      },
      {
        category: 'LIGHTING_PHYSICS',
        title: 'Mismatched Corneal Catchlights',
        description: 'Pupillary reflections show twin specular highlights that violate ray-tracing physics.',
        severity: 'HIGH',
        location: 'Ocular iris perimeter'
      }
    ],
    keyFindings: [
      'Confirmed synthetic neural latent diffusion pattern with 98.2% mathematical probability.',
      'Absence of physical camera CMOS sensor Bayer pattern demosaicing noise.',
      'Pupillary catchlights fail physical ray-tracing validation.'
    ],
    forensicSummary: 'Definitive detection of AI image synthesis (Midjourney v6.1). Hallmark diffusion signatures: unnatural dermal smoothness and non-physical corneal reflections.',
    courtEvidenceDeclaration: 'FORENSIC DECLARATION OF SYNTHESIS (IMG-CASE-948211): Microscopic examination verifies image was generated algorithmically by a neural diffusion network.'
  },
  {
    id: 'photo-seed-02',
    caseNumber: 'IMG-CASE-931084',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    filename: 'authentic_canon_eos_portrait.jpg',
    verdict: 'REAL_AUTHENTIC_PHOTO',
    aiGeneratedProbability: 2.1,
    realPhotoProbability: 97.9,
    confidence: 96,
    estimatedGenerator: 'Optical CMOS Camera Sensor (Canon EOS R5)',
    metrics: {
      anatomicalBiologicalScore: 3,
      lightingOpticsScore: 5,
      compressionSensorNoiseScore: 6,
      frequencyArtifactScore: 2,
      semanticPhysicsScore: 4
    },
    detectedAnomalies: [
      {
        category: 'TEXTURE_NOISE',
        title: 'Authentic Poisson-Gaussian Sensor Noise Verified',
        description: 'Consistent photon shot noise verified across luminance channels conforming to optical sensor physics.',
        severity: 'LOW',
        location: 'Uniform distribution across shadow and midtones'
      }
    ],
    keyFindings: [
      'Authentic camera optical sensor grain verified across RGB channels.',
      'Corneal reflections and micro-pores pass optical biological scrutiny.',
      'Physical lens depth of field with realistic circle of confusion.'
    ],
    forensicSummary: 'Rigorous forensic examination confirms genuine optical photography with authentic camera CMOS sensor noise and physical ray-traced lighting.',
    courtEvidenceDeclaration: 'FORENSIC CERTIFICATE OF AUTHENTICITY (IMG-CASE-931084): All forensic vectors confirm this image originated from an optical camera system.'
  }
];

let videoHistory: VideoForensicResult[] = [
  {
    id: 'vid-seed-01',
    caseNumber: 'VID-948102',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    filename: 'executive_authorization_deepfake.mp4',
    videoDurationSec: 5.0,
    fps: 30,
    totalFramesAnalyzed: 150,
    verdict: 'SUSPECTED_FACE_SWAP',
    deepfakeProbability: 97.4,
    realVideoProbability: 2.6,
    confidence: 98,
    estimatedGenerator: 'DeepFaceLab v2.4 (SAEHD Face-Swap)',
    metrics: {
      facialBorderBlendingScore: 94,
      eyeBlinkPhysiologyScore: 88,
      lipSyncAudioVisualScore: 72,
      temporalFlickerScore: 91,
      skinTextureSmoothingScore: 86
    },
    detectedAnomalies: [
      {
        category: 'FACIAL_BORDER',
        title: 'Jawline Mask Boundary Seam Discontinuity',
        description: 'Abrupt step-change in edge gradient and color temperature (ΔE = 8.4) between donor face mask and target neck skin.',
        severity: 'CRITICAL',
        timestampSec: 1.2,
        frameIndex: 36,
        location: 'Lower mandible & left cervical boundary'
      },
      {
        category: 'BLINK_DYNAMICS',
        title: 'Suppressed Biometric Blink Frequency',
        description: 'Zero complete physiological eyelid closures detected across 5.0 seconds.',
        severity: 'HIGH',
        timestampSec: 2.4,
        frameIndex: 72,
        location: 'Bilateral ocular palpebral fissures'
      }
    ],
    frameTimeline: [],
    keyFindings: [
      'Critical face-swap boundary seam detected around chin and jawline',
      'Eyelid blinking completely suppressed during 5.0s recording'
    ],
    forensicSummary: 'Extensive facial replacement forensics confirm high-confidence DeepFaceLab identity spoofing.',
    courtEvidenceDeclaration: 'Certified Digital Forensic Examination Report (ISO/IEC 27037). Evidence demonstrates synthetic facial replacement targeting executive impersonation.'
  }
];

export const db = {
  getLogs: () => [...analysisLogs].reverse(),
  addLog: (entry: AnalysisLogEntry) => {
    analysisLogs.push(entry);
    if (analysisLogs.length > 200) analysisLogs.shift();
  },
  clearLogs: () => {
    analysisLogs = [];
  },
  getStats: () => {
    const total = analysisLogs.length;
    const highRisk = analysisLogs.filter(l => l.verdict === 'ACTIVE_SCAM_ATTACK' || l.verdict === 'HIGH_RISK_DEEPFAKE' || l.aiRisk >= 70).length;
    const scamDetected = analysisLogs.filter(l => l.scamDetected).length;
    return { total, highRisk, scamDetected };
  },
  getSpeakers: () => enrolledSpeakers,
  addSpeaker: (speaker: EnrolledSpeaker) => {
    enrolledSpeakers.push(speaker);
  },
  removeSpeaker: (id: string) => {
    enrolledSpeakers = enrolledSpeakers.filter(s => s.id !== id);
  },
  getPhotoHistory: () => [...photoHistory],
  addPhotoHistory: (entry: PhotoForensicResult) => {
    const idx = photoHistory.findIndex(p => p.id === entry.id || p.caseNumber === entry.caseNumber);
    if (idx !== -1) {
      photoHistory[idx] = entry;
    } else {
      photoHistory.unshift(entry);
      if (photoHistory.length > 150) photoHistory.pop();
    }
  },
  deletePhotoHistory: (id: string) => {
    photoHistory = photoHistory.filter(p => p.id !== id && p.caseNumber !== id);
    return true;
  },
  clearPhotoHistory: () => {
    photoHistory = [];
    return true;
  },
  getVideoHistory: () => [...videoHistory],
  addVideoHistory: (entry: VideoForensicResult) => {
    const idx = videoHistory.findIndex(v => v.id === entry.id || v.caseNumber === entry.caseNumber);
    if (idx !== -1) {
      videoHistory[idx] = entry;
    } else {
      videoHistory.unshift(entry);
      if (videoHistory.length > 100) videoHistory.pop();
    }
  },
  deleteVideoHistory: (id: string) => {
    videoHistory = videoHistory.filter(v => v.id !== id && v.caseNumber !== id);
    return true;
  },
  clearVideoHistory: () => {
    videoHistory = [];
    return true;
  },
  createChallenge: (phrase: string): ActiveLivenessChallenge => {
    const id = `ch-${Date.now()}`;
    const challenge: ActiveLivenessChallenge = {
      challengeId: id,
      promptPhrase: phrase,
      generatedAt: Date.now(),
      expiresAt: Date.now() + 60000, // 1 min validity
      status: 'PENDING'
    };
    activeChallenges.set(id, challenge);
    return challenge;
  },
  getChallenge: (id: string) => activeChallenges.get(id),
  updateChallenge: (id: string, update: Partial<ActiveLivenessChallenge>) => {
    const current = activeChallenges.get(id);
    if (current) {
      const updated = { ...current, ...update };
      activeChallenges.set(id, updated);
      return updated;
    }
    return null;
  },
  getCallSummaries: () => [...callSummaries],
  getCallSummaryById: (caseId: string) => callSummaries.find(c => c.caseId === caseId),
  addCallSummary: (summary: CallSummaryData) => {
    const existingIdx = callSummaries.findIndex(c => c.caseId === summary.caseId);
    if (existingIdx !== -1) {
      callSummaries[existingIdx] = summary;
    } else {
      callSummaries.unshift(summary);
      if (callSummaries.length > 200) callSummaries.pop();
    }
    return summary;
  },
  updateCallCaseStatus: (caseId: string, status: any, notes?: string, reviewer?: string) => {
    const target = callSummaries.find(c => c.caseId === caseId);
    if (target) {
      target.caseReviewStatus = status;
      if (notes) target.reviewerNotes = notes;
      if (reviewer) target.reviewedBy = reviewer;
      target.reviewedAt = new Date().toISOString();
      return target;
    }
    return null;
  },
  deleteCallSummary: (caseId: string) => {
    callSummaries = callSummaries.filter(c => c.caseId !== caseId);
    return true;
  }
};

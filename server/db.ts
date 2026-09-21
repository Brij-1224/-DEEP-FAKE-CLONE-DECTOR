/**
 * VeriShield AI — Incident Database & Enrolled Speaker Store
 */

import { AnalysisLogEntry, EnrolledSpeaker, ActiveLivenessChallenge, PhotoForensicResult } from '../src/types';

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
  }
};

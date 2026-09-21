import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, X, Sparkles, Mic, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import { ActiveLivenessChallenge } from '../types';

interface ActiveLivenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLivenessCompleted?: () => void;
}

export const ActiveLivenessModal: React.FC<ActiveLivenessModalProps> = ({
  isOpen,
  onClose,
  onLivenessCompleted
}) => {
  const [challenge, setChallenge] = useState<ActiveLivenessChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fetchNewChallenge = async () => {
    setLoading(true);
    setVerificationResult(null);
    setTranscriptInput('');
    try {
      const res = await fetch('/api/liveness/challenge', { method: 'POST' });
      const data = await res.json();
      setChallenge(data);
    } catch (err) {
      console.error('Failed to generate challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNewChallenge();
    }
  }, [isOpen]);

  const verifyResponse = async (textToVerify: string) => {
    if (!challenge) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/liveness/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          transcript: textToVerify
        })
      });
      const data = await res.json();
      setVerificationResult(data);
      if (onLivenessCompleted) onLivenessCompleted();
    } catch (err) {
      console.error('Failed to verify challenge:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-chakra text-slate-100">
              ACTIVE CALLER LIVENESS CHALLENGE
            </h3>
            <p className="text-xs text-slate-400">
              Interactive zero-knowledge phrase challenge to defeat pre-recorded replays and TTS deepfakes
            </p>
          </div>
        </div>

        {/* Prompt Challenge Box */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 text-center mb-5">
          <div className="text-xs font-mono-code text-cyan-400 uppercase tracking-widest mb-1.5">
            Prompt Caller To Speak Exactly:
          </div>

          {loading ? (
            <div className="py-4 text-slate-400 flex items-center justify-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Generating dynamic anti-spoof seed...
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-black font-chakra text-slate-100 tracking-wider py-2 select-all">
              "{challenge?.promptPhrase || 'Blue mango 47'}"
            </div>
          )}

          <div className="text-[11px] text-slate-400 mt-2">
            Dynamic cryptographic phrase valid for 60s &bull; Tests phoneme timing &amp; glottal liveness
          </div>
        </div>

        {/* Verification Result Display */}
        {verificationResult ? (
          <div className={`p-4 rounded-xl border mb-5 ${
            verificationResult.success
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
              : 'bg-red-950/60 border-red-500 text-red-200'
          }`}>
            <div className="flex items-center gap-2 font-bold font-chakra text-base mb-1">
              {verificationResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>CALLER VERIFIED AS GENUINE LIVE HUMAN</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-5 h-5 text-red-400" />
                  <span>SPOOF DETECTED — LIVENESS CHALLENGE FAILED</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-300">
              {verificationResult.success
                ? `Caller correctly uttered the challenge phrase. Organic acoustic liveness: ${verificationResult.acousticLivenessScore}%. Safe to proceed.`
                : `Caller failed to match phrase or presented robotic synthetic speech. Recommended action: Terminate call.`}
            </p>
          </div>
        ) : (
          /* Test / Simulation Input */
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Caller Utterance / Transcript:</span>
              <span className="text-cyan-400 text-[11px]">Type or use simulation buttons</span>
            </div>

            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder={`e.g. "${challenge?.promptPhrase || 'Blue mango 47'}"`}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono-code focus:outline-none focus:border-cyan-500"
            />

            {/* Quick Simulation Options */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (challenge) {
                    setTranscriptInput(challenge.promptPhrase);
                    verifyResponse(challenge.promptPhrase);
                  }
                }}
                disabled={verifying}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Human Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTranscriptInput("Hello? Who is this? I can't hear you...");
                  verifyResponse("Hello? Who is this? I can't hear you...");
                }}
                disabled={verifying}
                className="flex-1 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/60 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Simulate Bot / Replay Fail</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={fetchNewChallenge}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate New Phrase</span>
          </button>

          <button
            onClick={() => {
              if (transcriptInput.trim()) verifyResponse(transcriptInput);
            }}
            disabled={verifying || !transcriptInput.trim()}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            {verifying ? 'Evaluating Acoustic Physics...' : 'Verify Caller Utterance'}
          </button>
        </div>

      </div>
    </div>
  );
};

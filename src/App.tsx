import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LiveCallMonitor } from './components/LiveCallMonitor';
import { ActiveLivenessModal } from './components/ActiveLivenessModal';
import { DeepForensicModal } from './components/DeepForensicModal';
import { SpeakerEnrollment } from './components/SpeakerEnrollment';
import { LatencyBenchmarks } from './components/LatencyBenchmarks';
import { AdminPortal } from './components/AdminPortal';
import { ForensicLab } from './components/ForensicLab';
import { PhotoForensicsDetector } from './components/PhotoForensicsDetector';
import { LiveAnalysisResult, EnrolledSpeaker, LatencyBenchmark } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'upload' | 'photo' | 'speakers' | 'benchmarks' | 'admin'>('live');
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Modals
  const [showLivenessModal, setShowLivenessModal] = useState(false);
  const [showForensicModal, setShowForensicModal] = useState(false);
  const [selectedForensicData, setSelectedForensicData] = useState<LiveAnalysisResult | null>(null);

  // State
  const [lastAnalysis, setLastAnalysis] = useState<LiveAnalysisResult | null>(null);
  const [lastLatency, setLastLatency] = useState<LatencyBenchmark | null>(null);
  const [enrolledSpeakers, setEnrolledSpeakers] = useState<EnrolledSpeaker[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  const setupWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live-analysis`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[VeriShield] WebSocket connected to live-analysis stream');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ANALYSIS_RESULT') {
            const result = msg.payload as LiveAnalysisResult;
            setLastAnalysis(result);
            if (result.benchmark) {
              setLastLatency(result.benchmark);
            }
          }
        } catch (e) {
          console.error('[VeriShield] Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Retry connection after 3 seconds
        setTimeout(setupWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[VeriShield] WS error, fallback mode available', err);
        setWsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.warn('[VeriShield] WebSocket initialization error:', err);
    }
  };

  // Fetch enrolled speakers on mount
  const fetchSpeakers = async () => {
    try {
      const res = await fetch('/api/speakers');
      if (res.ok) {
        const data = await res.json();
        setEnrolledSpeakers(data.speakers || []);
      }
    } catch (err) {
      console.error('Failed to load speakers:', err);
    }
  };

  useEffect(() => {
    setupWebSocket();
    fetchSpeakers();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Dispatch live audio chunk via WebSocket or HTTP fallback
  const handleSendAudioChunk = async (
    pcm: number[],
    transcript: string,
    claimedIdentity: string | null,
    customContext?: any
  ) => {
    // If WebSocket is open, send chunk
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'AUDIO_CHUNK',
        pcm,
        transcript,
        claimedIdentity,
        customContext
      }));
    } else {
      // HTTP fallback
      try {
        const res = await fetch('/api/analyze/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: '',
            pcm,
            transcript,
            claimedIdentity,
            customContext
          })
        });
        if (res.ok) {
          const data = await res.json();
          setLastAnalysis(data);
          if (data.benchmark) {
            setLastLatency(data.benchmark);
          }
        }
      } catch (err) {
        console.error('HTTP fallback error:', err);
      }
    }
  };

  // Analyze standalone audio file
  const handleAnalyzeAudioFile = async (payload: {
    filename: string;
    transcript: string;
    customContext?: any;
  }): Promise<LiveAnalysisResult> => {
    const res = await fetch('/api/analyze/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: payload.filename,
        transcript: payload.transcript,
        customContext: payload.customContext
      })
    });
    const data = await res.json();
    setLastAnalysis(data);
    if (data.benchmark) setLastLatency(data.benchmark);
    return data;
  };

  // Speaker enrollment handlers
  const handleAddSpeaker = async (speaker: { name: string; relation: string; baselinePitchHz: number }) => {
    const res = await fetch('/api/speakers/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(speaker)
    });
    if (res.ok) {
      await fetchSpeakers();
    }
  };

  const handleRemoveSpeaker = async (id: string) => {
    const res = await fetch(`/api/speakers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchSpeakers();
    }
  };

  const handleOpenForensicReport = (result: LiveAnalysisResult) => {
    setSelectedForensicData(result);
    setShowForensicModal(true);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isStreaming={isStreaming}
        wsConnected={wsConnected}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'live' && (
          <LiveCallMonitor
            onTriggerLiveness={() => setShowLivenessModal(true)}
            onOpenForensicReport={handleOpenForensicReport}
            enrolledSpeakers={enrolledSpeakers}
            wsConnected={wsConnected}
            onSendWebSocketChunk={handleSendAudioChunk}
            lastAnalysis={lastAnalysis}
          />
        )}

        {activeTab === 'upload' && (
          <ForensicLab
            onAnalyzeAudioFile={handleAnalyzeAudioFile}
            onOpenForensicReport={handleOpenForensicReport}
          />
        )}

        {activeTab === 'photo' && (
          <PhotoForensicsDetector />
        )}

        {activeTab === 'speakers' && (
          <SpeakerEnrollment
            speakers={enrolledSpeakers}
            onAddSpeaker={handleAddSpeaker}
            onRemoveSpeaker={handleRemoveSpeaker}
          />
        )}

        {activeTab === 'benchmarks' && (
          <LatencyBenchmarks
            lastLatency={lastLatency}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            onBackToSite={() => setActiveTab('live')}
          />
        )}
      </main>

      {/* Interactive Modals */}
      <ActiveLivenessModal
        isOpen={showLivenessModal}
        onClose={() => setShowLivenessModal(false)}
      />

      <DeepForensicModal
        isOpen={showForensicModal}
        onClose={() => setShowForensicModal(false)}
        analysisData={selectedForensicData || lastAnalysis}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05070d] py-4 text-center text-xs text-slate-500 font-mono-code">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            VERISHIELD AI &bull; Smart India Hackathon (SIH) Real-Time AI Deepfake Defense Pipeline
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>WebSocket: {wsConnected ? 'Connected (16kHz)' : 'Active (HTTP Fallback)'}</span>
            <span>&bull;</span>
            <span>Gemini 3.1 Pro Thinking: Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

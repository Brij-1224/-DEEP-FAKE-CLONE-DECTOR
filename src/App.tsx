import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LiveCallMonitor } from './components/LiveCallMonitor';
import { InvestigationDashboard } from './components/InvestigationDashboard';
import { ActiveLivenessModal } from './components/ActiveLivenessModal';
import { DeepForensicModal } from './components/DeepForensicModal';
import { SpeakerEnrollment } from './components/SpeakerEnrollment';
import { LatencyBenchmarks } from './components/LatencyBenchmarks';
import { AdminPortal } from './components/AdminPortal';
import { ForensicLab } from './components/ForensicLab';
import { PhotoForensicsDetector } from './components/PhotoForensicsDetector';
import { DeepfakeVideoDetector } from './components/DeepfakeVideoDetector';
import { EvidenceReportModal } from './components/EvidenceReportModal';
import { LiveAnalysisResult, EnrolledSpeaker, LatencyBenchmark, CallSummaryData } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'investigation' | 'upload' | 'photo' | 'video' | 'speakers' | 'benchmarks' | 'admin'>('live');
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Modals
  const [showLivenessModal, setShowLivenessModal] = useState(false);
  const [showForensicModal, setShowForensicModal] = useState(false);
  const [selectedForensicData, setSelectedForensicData] = useState<LiveAnalysisResult | null>(null);
  const [investigationReportData, setInvestigationReportData] = useState<CallSummaryData | null>(null);

  // State
  const [lastAnalysis, setLastAnalysis] = useState<LiveAnalysisResult | null>(null);
  const [lastLatency, setLastLatency] = useState<LatencyBenchmark | null>(null);
  const [enrolledSpeakers, setEnrolledSpeakers] = useState<EnrolledSpeaker[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const setupWebSocket = () => {
    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

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
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(setupWebSocket, 4000);
      };

      ws.onerror = (err) => {
        console.warn('[VeriShield] WS status notice, fallback mode active:', err);
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
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Dispatch live audio chunk via WebSocket or HTTP fallback
  const handleSendAudioChunk = async (
    pcm: number[] | Float32Array,
    transcript: string,
    claimedIdentity: string | null,
    customContext?: any
  ) => {
    const pcmArray = Array.isArray(pcm) ? pcm : Array.from(pcm);

    // If WebSocket is open, send chunk
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'AUDIO_CHUNK',
        pcm: pcmArray,
        audioPcm: pcmArray,
        transcript,
        claimedIdentity,
        customContext,
        vadTriggered: customContext?.vadTriggered
      }));
    } else {
      // Fast HTTP stream-chunk fallback
      try {
        const res = await fetch('/api/analyze/stream-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pcm: pcmArray.length > 8192 ? pcmArray.slice(-8192) : pcmArray,
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
        console.error('HTTP streaming fallback error:', err);
      }
    }
  };

  // Analyze standalone audio file
  const handleAnalyzeAudioFile = async (payload: {
    filename: string;
    transcript: string;
    customContext?: any;
    pcm?: number[];
  }): Promise<LiveAnalysisResult> => {
    const res = await fetch('/api/analyze/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: payload.filename,
        transcript: payload.transcript,
        customContext: payload.customContext,
        pcm: payload.pcm
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

        {activeTab === 'investigation' && (
          <InvestigationDashboard
            onOpenEvidenceReport={(caseData) => setInvestigationReportData(caseData)}
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

        {activeTab === 'video' && (
          <DeepfakeVideoDetector />
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

      {/* Investigation Dashboard Evidence Report Modal */}
      <EvidenceReportModal
        isOpen={!!investigationReportData}
        caseData={investigationReportData}
        onClose={() => setInvestigationReportData(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05070d] py-4 text-center text-xs text-slate-500 font-mono-code">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            TRUTHNET AI &bull; Smart India Hackathon (SIH 2026) Real-Time AI Deepfake Defense Pipeline
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

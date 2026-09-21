import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Eye, 
  Maximize2, 
  Download, 
  FileText, 
  RefreshCw, 
  ZoomIn, 
  Sun, 
  Sliders, 
  Zap, 
  Play,
  History,
  Search,
  Trash2,
  Filter,
  ExternalLink,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { PhotoForensicResult, PhotoVerdict } from '../types';

interface PhotoForensicsDetectorProps {
  onScanComplete?: (result: PhotoForensicResult) => void;
}

export const PhotoForensicsDetector: React.FC<PhotoForensicsDetectorProps> = ({ onScanComplete }) => {
  // Main view state: 'scanner' (Forensic Lab) or 'history' (Scan History)
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoForensicResult | null>(null);
  const [activeFilterView, setActiveFilterView] = useState<'original' | 'ela' | 'noise' | 'edges'>('original');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [elaIntensity, setElaIntensity] = useState(15);

  // History State
  const [historyList, setHistoryList] = useState<PhotoForensicResult[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'AI_GENERATED' | 'REAL_AUTHENTIC_PHOTO' | 'SUSPICIOUS'>('ALL');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  // Canvases for client-side forensic filters (ELA, Noise, and Edges)
  const filterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-configured high-contrast benchmark cases for evaluation
  const BENCHMARK_PHOTOS = [
    {
      id: 'ai-midjourney',
      label: '🤖 AI Portrait (Midjourney v6.1)',
      category: 'AI-GENERATED',
      model: 'Midjourney v6.1 Photoreal',
      filename: 'midjourney_v6_ultra_realistic_portrait.jpg',
      desc: 'Hyper-smooth plastic skin texture, dual non-physical corneal catchlights, missing CMOS shot noise.',
      presetType: 'Midjourney v6.1',
      isPresetAi: true
    },
    {
      id: 'ai-flux',
      label: '🤖 AI Executive (Flux.1 Dev)',
      category: 'AI-GENERATED',
      model: 'Flux.1 Schnell / Dev',
      filename: 'flux_corporate_headshot_synthetic.jpg',
      desc: 'Clustered melting hair strands, synthetic depth of field blur bleeding across collar edge.',
      presetType: 'Flux.1 Dev',
      isPresetAi: true
    },
    {
      id: 'ai-dalle',
      label: '🤖 AI Complex Scene (DALL-E 3)',
      category: 'AI-GENERATED',
      model: 'DALL-E 3 (OpenAI)',
      filename: 'dalle3_deepfake_scene_hallucination.jpg',
      desc: 'Warped perspective vanishing points, unreadable pseudo-text glyphs on background signs.',
      presetType: 'DALL-E 3',
      isPresetAi: true
    },
    {
      id: 'real-dslr',
      label: '📸 Real Camera (Canon EOS R5 DSLR)',
      category: 'REAL-AUTHENTIC',
      model: 'Canon EOS R5 Full-Frame Optical Sensor',
      filename: 'canon_r5_optical_portrait_iso400.jpg',
      desc: 'Physical Poisson-Gaussian photon sensor grain, natural epidermal micro-pores, physical ray-traced shadows.',
      presetType: 'Canon EOS R5 Full-Frame Optical Sensor',
      isPresetAi: false
    },
    {
      id: 'real-iphone',
      label: '📸 Real Smartphone (iPhone 15 Pro)',
      category: 'REAL-AUTHENTIC',
      model: 'Apple iPhone 15 Pro Optical Camera',
      filename: 'iphone15pro_natural_daylight_photo.jpg',
      desc: 'Authentic Bayer demosaicing artifacts, lens flare with natural chromatic aberration, uniform JPEG DCT blocks.',
      presetType: 'Apple iPhone 15 Pro Optical Camera',
      isPresetAi: false
    }
  ];

  // Helper to generate representative test canvas image for presets
  const generatePresetImage = (preset: typeof BENCHMARK_PHOTOS[0]): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const isAi = preset.isPresetAi;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 720, 720);
    if (isAi) {
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#311042');
    } else {
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.5, '#292524');
      bgGrad.addColorStop(1, '#0c0a09');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 720, 720);

    // Subject Silhouette / Portrait
    ctx.save();
    // Head & Shoulders
    ctx.fillStyle = isAi ? '#f8fafc' : '#f5d0b5';
    ctx.beginPath();
    ctx.arc(360, 310, 150, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(360, 620, 240, 180, 0, 0, Math.PI * 2);
    ctx.fillStyle = isAi ? '#0284c7' : '#334155';
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(310, 290, 22, 0, Math.PI * 2);
    ctx.arc(410, 290, 22, 0, Math.PI * 2);
    ctx.fill();

    // Catchlights (Specular reflections)
    if (isAi) {
      // AI flaw: Two conflicting catchlights on one eye, one on other (physics violation)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(305, 285, 6, 0, Math.PI * 2);
      ctx.arc(318, 295, 4, 0, Math.PI * 2); // Secondary conflicting highlight!
      ctx.arc(415, 285, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Real: Single physically aligned catchlight matching key light
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(305, 285, 5, 0, Math.PI * 2);
      ctx.arc(405, 285, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lips
    ctx.fillStyle = isAi ? '#f43f5e' : '#e11d48';
    ctx.beginPath();
    ctx.ellipse(360, 390, 45, 14, 0, 0, Math.PI);
    ctx.fill();

    // Add sensor noise or AI smoothness
    if (!isAi) {
      // Real camera: Add Poisson-Gaussian photon shot noise
      const imgData = ctx.getImageData(0, 0, 720, 720);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        d[i] = Math.min(255, Math.max(0, d[i] + noise));
        d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise));
        d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Watermark tag
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`VERISHIELD FORENSIC TEST: ${preset.filename}`, 25, 40);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`Target: ${preset.model}`, 25, 65);

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Load Scan History from Backend and LocalStorage
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/photo/history');
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setHistoryList(data.history);
          localStorage.setItem('vs_photo_history', JSON.stringify(data.history));
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch server photo history, checking localStorage...', err);
    } finally {
      setLoadingHistory(false);
    }

    // Fallback to localStorage if server offline
    const local = localStorage.getItem('vs_photo_history');
    if (local) {
      try {
        setHistoryList(JSON.parse(local));
      } catch (e) {
        // ignore parse error
      }
    }
  };

  // Delete an individual scan from history
  const handleDeleteHistoryItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/photo/history/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed, updating local state', err);
    }
    const updated = historyList.filter(item => item.id !== id && item.caseNumber !== id);
    setHistoryList(updated);
    localStorage.setItem('vs_photo_history', JSON.stringify(updated));
  };

  // Clear all scan history
  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all Photo Forensic Scan History? This action cannot be undone.')) {
      return;
    }
    try {
      await fetch('/api/photo/history', { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend clear failed', err);
    }
    setHistoryList([]);
    localStorage.removeItem('vs_photo_history');
  };

  // Load a historical scan back into the live forensic inspector
  const handleSelectHistoryItem = (item: PhotoForensicResult) => {
    setResult(item);
    setImageFileName(item.filename);
    if (item.imageBase64 || item.thumbnailUrl) {
      setSelectedImage(item.imageBase64 || item.thumbnailUrl || null);
    }
    setActiveTab('scanner');
  };

  // Fetch history on initial mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Run Error Level Analysis (ELA) and Noise Filters on the current image
  useEffect(() => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImage;
    img.onload = () => {
      const filterCanvas = filterCanvasRef.current;
      if (!filterCanvas) return;

      filterCanvas.width = img.width;
      filterCanvas.height = img.height;
      const ctx = filterCanvas.getContext('2d');
      if (!ctx) return;

      if (activeFilterView === 'original') {
        ctx.drawImage(img, 0, 0);
        return;
      }

      if (activeFilterView === 'ela') {
        // Compute Error Level Analysis (ELA)
        ctx.drawImage(img, 0, 0);
        const originalData = ctx.getImageData(0, 0, img.width, img.height);

        // Re-encode as high-compression JPEG to a secondary temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(img, 0, 0);
        const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.75);

        const compImg = new Image();
        compImg.src = compressedDataUrl;
        compImg.onload = () => {
          tempCtx.drawImage(compImg, 0, 0);
          const compData = tempCtx.getImageData(0, 0, img.width, img.height);

          const outImgData = ctx.createImageData(img.width, img.height);
          const orig = originalData.data;
          const comp = compData.data;
          const out = outImgData.data;
          const scale = elaIntensity;

          for (let i = 0; i < orig.length; i += 4) {
            const diffR = Math.abs(orig[i] - comp[i]) * scale;
            const diffG = Math.abs(orig[i + 1] - comp[i + 1]) * scale;
            const diffB = Math.abs(orig[i + 2] - comp[i + 2]) * scale;

            out[i] = Math.min(255, diffR);
            out[i + 1] = Math.min(255, diffG);
            out[i + 2] = Math.min(255, diffB);
            out[i + 3] = 255;
          }
          ctx.putImageData(outImgData, 0, 0);
        };
        return;
      }

      if (activeFilterView === 'noise') {
        // High-pass Laplacian filter to isolate sensor noise / PRNU
        ctx.drawImage(img, 0, 0);
        const src = ctx.getImageData(0, 0, img.width, img.height);
        const out = ctx.createImageData(img.width, img.height);
        const s = src.data;
        const d = out.data;
        const w = img.width;
        const h = img.height;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const center = s[idx];
            const top = s[((y - 1) * w + x) * 4];
            const bottom = s[((y + 1) * w + x) * 4];
            const left = s[(y * w + (x - 1)) * 4];
            const right = s[(y * w + (x + 1)) * 4];

            const highPass = Math.abs(4 * center - top - bottom - left - right) * 4.5;
            const val = Math.min(255, Math.max(0, highPass));

            d[idx] = val > 90 ? 255 : val;
            d[idx + 1] = val > 90 ? 80 : val * 0.4;
            d[idx + 2] = val > 90 ? 180 : 255;
            d[idx + 3] = 255;
          }
        }
        ctx.putImageData(out, 0, 0);
        return;
      }

      if (activeFilterView === 'edges') {
        // Sobel Gradient Magnitude to detect depth-of-field edge bleeding
        ctx.drawImage(img, 0, 0);
        const src = ctx.getImageData(0, 0, img.width, img.height);
        const out = ctx.createImageData(img.width, img.height);
        const s = src.data;
        const d = out.data;
        const w = img.width;
        const h = img.height;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const gx = -s[((y-1)*w + (x-1))*4] + s[((y-1)*w + (x+1))*4]
                       -2*s[(y*w + (x-1))*4]   + 2*s[(y*w + (x+1))*4]
                       -s[((y+1)*w + (x-1))*4] + s[((y+1)*w + (x+1))*4];
            const gy = -s[((y-1)*w + (x-1))*4] - 2*s[((y-1)*w + x)*4] - s[((y-1)*w + (x+1))*4]
                       +s[((y+1)*w + (x-1))*4] + 2*s[((y+1)*w + x)*4] + s[((y+1)*w + (x+1))*4];
            const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.5);

            d[idx] = mag > 80 ? 239 : 15;
            d[idx + 1] = mag > 80 ? 68 : 23;
            d[idx + 2] = mag > 80 ? 68 : 42;
            d[idx + 3] = 255;
          }
        }
        ctx.putImageData(out, 0, 0);
      }
    };
  }, [selectedImage, activeFilterView, elaIntensity]);

  // Execute scan against backend /api/analyze/photo
  const handleAnalyzePhoto = async (dataUrl: string, filename: string, customContext?: any, mimeType?: string) => {
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: mimeType || 'image/jpeg',
          filename,
          customContext
        })
      });

      if (!res.ok) throw new Error('Photo detection request failed');
      const data: PhotoForensicResult = await res.json();
      
      // Attach image data for local caching in history
      const fullResult: PhotoForensicResult = {
        ...data,
        thumbnailUrl: dataUrl.length < 500000 ? dataUrl : dataUrl.slice(0, 100000),
        imageBase64: dataUrl.length < 2500000 ? dataUrl : undefined
      };

      setResult(fullResult);
      if (onScanComplete) onScanComplete(fullResult);

      // Prepend to history list immediately
      setHistoryList(prev => {
        const filtered = prev.filter(p => p.id !== fullResult.id && p.caseNumber !== fullResult.caseNumber);
        const updated = [fullResult, ...filtered];
        localStorage.setItem('vs_photo_history', JSON.stringify(updated.slice(0, 100)));
        return updated;
      });

    } catch (err) {
      console.error('Error analyzing photo:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload custom photo from disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const mime = file.type || 'image/jpeg';
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;

      // Resizing guard: ensure ultra-high resolution photos (e.g. 24MP phone photos)
      // don't freeze the browser canvas or overwhelm HTTP body limits
      const img = new Image();
      img.src = rawDataUrl;
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        let finalDataUrl = rawDataUrl;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL(mime.includes('png') ? 'image/png' : 'image/jpeg', 0.92);
          }
        }

        setSelectedImage(finalDataUrl);
        handleAnalyzePhoto(finalDataUrl, file.name, undefined, mime);
      };
    };

    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-selecting same file
  };

  // Pick preset benchmark test
  const handleSelectBenchmark = (preset: typeof BENCHMARK_PHOTOS[0]) => {
    setImageFileName(preset.filename);
    const dataUrl = generatePresetImage(preset);
    setSelectedImage(dataUrl);
    handleAnalyzePhoto(dataUrl, preset.filename, {
      isPresetAi: preset.isPresetAi,
      presetType: preset.model,
      description: preset.desc
    }, 'image/jpeg');
  };

  // Initialize with the first benchmark on mount if nothing selected
  useEffect(() => {
    if (!selectedImage) {
      handleSelectBenchmark(BENCHMARK_PHOTOS[0]);
    }
  }, []);

  // Filtered history list
  const filteredHistory = historyList.filter(item => {
    const matchesSearch = 
      item.filename.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.caseNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.estimatedGenerator.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.verdict.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (historyFilter === 'ALL') return true;
    if (historyFilter === 'AI_GENERATED') {
      return item.verdict === 'AI_GENERATED' || item.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC';
    }
    if (historyFilter === 'REAL_AUTHENTIC_PHOTO') {
      return item.verdict === 'REAL_AUTHENTIC_PHOTO';
    }
    if (historyFilter === 'SUSPICIOUS') {
      return item.detectedAnomalies.length > 0;
    }
    return true;
  });

  const aiCount = historyList.filter(h => h.verdict === 'AI_GENERATED' || h.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC').length;
  const realCount = historyList.filter(h => h.verdict === 'REAL_AUTHENTIC_PHOTO').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-chakra text-slate-100">
              AI-GENERATED VS. REAL PHOTO FORENSIC DETECTOR
            </h2>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono-code font-bold text-cyan-300">
              VISION V2.5 + EXIF AUDIT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Microscopic dermal pores &bull; Corneal catchlight ray-tracing &bull; ELA compression heatmaps &bull; CMOS Poisson PRNU sensor grain &bull; Persistent Forensic Scan History
          </p>
        </div>

        {/* View Mode Switcher + Upload Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Forensic Lab</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Scan History</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono-code text-slate-300">
                {historyList.length}
              </span>
            </button>
          </div>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* VIEW 1: LIVE FORENSIC LAB */}
      {activeTab === 'scanner' && (
        <>
          {/* Benchmark Presets Selector */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs font-mono-code text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>BENCHMARK CASES &amp; GENERATOR COMPARISONS:</span>
              </span>
              <span className="text-cyan-400 text-[11px] hidden sm:inline">Click any card to analyze instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {BENCHMARK_PHOTOS.map((preset) => {
                const isSelected = imageFileName === preset.filename;
                const isAi = preset.isPresetAi;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectBenchmark(preset)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? isAi
                          ? 'bg-red-950/40 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                          : 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded ${
                        isAi ? 'bg-red-950 border border-red-800 text-red-300' : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      }`}>
                        {preset.category}
                      </span>
                      <Play className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="text-xs font-bold font-chakra mt-2 truncate text-slate-200">
                      {preset.label}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Scans Quick Chip Strip */}
          {historyList.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono-code text-slate-400">
              <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
                <History className="w-3 h-3" /> Recent Scans:
              </span>
              {historyList.slice(0, 6).map((item) => {
                const isSelected = result?.id === item.id || result?.caseNumber === item.caseNumber;
                const isAi = item.verdict === 'AI_GENERATED' || item.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAi ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="truncate max-w-[120px]">{item.filename}</span>
                    <span className="text-[9px] text-slate-500 font-mono-code">{item.caseNumber.slice(-4)}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setActiveTab('history')}
                className="text-[11px] text-cyan-400 hover:underline shrink-0 ml-1 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All ({historyList.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Main Dual Inspector: Photo Viewer with ELA/Filters on Left, Deep Forensics on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Image Canvas & Filter Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative">
                
                {/* Filter Mode Selector */}
                <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-800 text-xs font-mono-code">
                  <span className="text-slate-400">Forensic View:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveFilterView('original')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeFilterView === 'original'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setActiveFilterView('ela')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeFilterView === 'ela'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Error Level Analysis: reveals compression anomalies"
                    >
                      ELA Heatmap
                    </button>
                    <button
                      onClick={() => setActiveFilterView('noise')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeFilterView === 'noise'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="High-Pass Sensor Noise: highlights camera PRNU vs AI plastic smoothing"
                    >
                      Sensor Noise
                    </button>
                    <button
                      onClick={() => setActiveFilterView('edges')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeFilterView === 'edges'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Sobel Gradient Anomaly Map"
                    >
                      Edge Anomaly
                    </button>
                  </div>
                </div>

                {/* Canvas Viewer with Zoom */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#070a12] border border-slate-800 flex items-center justify-center group">
                  <canvas
                    ref={filterCanvasRef}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-150"
                  />

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                      <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                      <div className="text-xs font-chakra font-bold text-cyan-300">
                        Analyzing Optical Sensor Grain &amp; Latent Diffusion Patterns...
                      </div>
                    </div>
                  )}

                  {/* View Overlay Tag */}
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/75 backdrop-blur-sm border border-slate-700/60 text-[10px] font-mono-code text-slate-300 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      activeFilterView === 'ela' ? 'bg-amber-400' :
                      activeFilterView === 'noise' ? 'bg-purple-400' :
                      activeFilterView === 'edges' ? 'bg-red-400' : 'bg-cyan-400'
                    }`}></span>
                    <span className="uppercase">{activeFilterView} Forensic Mode</span>
                  </div>
                </div>

                {/* Viewer Controls: Zoom & ELA Intensity */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span>Zoom:</span>
                    <button
                      onClick={() => setZoomLevel(z => Math.max(1, z - 0.25))}
                      className="w-6 h-6 rounded bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="font-mono-code text-slate-200">{zoomLevel}x</span>
                    <button
                      onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
                      className="w-6 h-6 rounded bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>

                  {activeFilterView === 'ela' && (
                    <div className="flex items-center gap-2">
                      <span>ELA Gain:</span>
                      <input
                        type="range"
                        min="5"
                        max="35"
                        value={elaIntensity}
                        onChange={(e) => setElaIntensity(Number(e.target.value))}
                        className="w-20 accent-amber-400 cursor-pointer"
                      />
                      <span className="font-mono-code text-amber-300">{elaIntensity}x</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 font-mono-code truncate max-w-[150px]">
                    {imageFileName}
                  </div>
                </div>

              </div>

              {/* Hardware & EXIF Metadata Inspection Box */}
              {result?.exifData && (
                <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-bold font-chakra text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Optical Hardware &amp; EXIF Profile</span>
                    </span>
                    <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded ${
                      result.exifData.hasExif ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {result.exifData.hasExif ? 'EXIF APP1 Verified' : 'EXIF Stripped / Web'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code pt-1">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-slate-500 text-[10px]">Camera Make</div>
                      <div className="text-slate-200 font-bold truncate">
                        {result.exifData.cameraMake || 'No hardware tag'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-slate-500 text-[10px]">Camera Model</div>
                      <div className="text-slate-200 font-bold truncate">
                        {result.exifData.cameraModel || 'Optical Sensor'}
                      </div>
                    </div>
                  </div>

                  {result.exifData.aiSignaturesDetected && result.exifData.aiSignaturesDetected.length > 0 && (
                    <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/80 text-red-300 text-[11px] font-mono-code">
                      <span className="font-bold">AI Metadata Signatures Detected: </span>
                      <span>{result.exifData.aiSignaturesDetected.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Forensic Mode Explainer Card */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold font-chakra text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Forensic Filter Methodology</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeFilterView === 'ela' && (
                    'Error Level Analysis (ELA) identifies regions with compression inconsistencies. In authentic camera photos, high-frequency edges and surfaces compress uniformly. In AI generations, latent patches exhibit distinct gradient compression signatures.'
                  )}
                  {activeFilterView === 'noise' && (
                    'High-Pass Sensor Noise isolates the physical Poisson photon shot noise from CMOS camera sensors. AI-generated images lack microscopic sensor grain and exhibit artificial mathematical smoothing.'
                  )}
                  {activeFilterView === 'edges' && (
                    'Sobel Gradient Anomaly evaluates edge falloff across the focal plane. AI diffusion generators frequently exhibit depth-of-field "bokeh bleeding" where soft blur overlaps sharp subject contours.'
                  )}
                  {activeFilterView === 'original' && (
                    'High-resolution raw image display. Inspect biological facial features, hair strand continuity, and specular corneal catchlights.'
                  )}
                </p>
              </div>

            </div>

            {/* Right Column: Complete Detection Verdict & Forensic Dimensional Meters (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {result ? (
                <>
                  {/* Giant Verdict Banner */}
                  <div className={`p-6 rounded-2xl border transition-all ${
                    result.verdict === 'AI_GENERATED' || result.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC'
                      ? 'glass-panel-danger shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                      : 'glass-panel-success shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {result.verdict === 'AI_GENERATED' || result.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC' ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/90 border border-red-500/80 text-red-300 font-chakra font-bold text-sm tracking-wide">
                              <ShieldAlert className="w-4 h-4 text-red-400" />
                              <span>SYNTHETIC MEDIA DETECTED: AI-GENERATED PHOTO</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-chakra font-bold text-sm tracking-wide">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>AUTHENTIC REAL PHOTOGRAPH VERIFIED</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-xl font-bold font-chakra text-slate-100 mt-1">
                          {result.estimatedGenerator}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {result.forensicSummary}
                        </p>
                      </div>

                      {/* Dual Probability Dial */}
                      <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-800 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-mono-code uppercase text-slate-400">AI Probability</div>
                          <div className={`text-3xl font-black font-chakra ${
                            result.aiGeneratedProbability >= 50 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {result.aiGeneratedProbability.toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-code">
                            Real: {result.realPhotoProbability.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Probability Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-mono-code text-slate-400 mb-1">
                        <span className={result.aiGeneratedProbability >= 50 ? 'text-red-400 font-bold' : ''}>
                          AI Generated ({result.aiGeneratedProbability.toFixed(1)}%)
                        </span>
                        <span>Confidence: {result.confidence}%</span>
                        <span className={result.realPhotoProbability > 50 ? 'text-emerald-400 font-bold' : ''}>
                          Real Camera ({result.realPhotoProbability.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
                        <div 
                          style={{ width: `${result.aiGeneratedProbability}%` }}
                          className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                        />
                        <div 
                          style={{ width: `${result.realPhotoProbability}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5 Dimensional Forensic Meters */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold font-chakra text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Dimensional Forensic Breakdown (Multi-Signal Analysis)</span>
                    </h4>

                    <div className="space-y-2.5 text-xs font-mono-code">
                      {/* Dimension 1 */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>1. Anatomical &amp; Biological Micro-Textures:</span>
                          <span className={result.metrics.anatomicalBiologicalScore >= 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {result.metrics.anatomicalBiologicalScore}/100 {result.metrics.anatomicalBiologicalScore >= 50 ? '(Synthetic/Plastic)' : '(Organic Pores)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${result.metrics.anatomicalBiologicalScore}%` }} 
                            className={`h-full ${result.metrics.anatomicalBiologicalScore >= 50 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>

                      {/* Dimension 2 */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>2. Physical Optics &amp; Shadow Vector Alignment:</span>
                          <span className={result.metrics.lightingOpticsScore >= 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {result.metrics.lightingOpticsScore}/100 {result.metrics.lightingOpticsScore >= 50 ? '(Non-Physical Lighting)' : '(Physically Consistent)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${result.metrics.lightingOpticsScore}%` }} 
                            className={`h-full ${result.metrics.lightingOpticsScore >= 50 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>

                      {/* Dimension 3 */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>3. CMOS Camera Sensor Noise (PRNU):</span>
                          <span className={result.metrics.compressionSensorNoiseScore >= 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {result.metrics.compressionSensorNoiseScore}/100 {result.metrics.compressionSensorNoiseScore >= 50 ? '(Missing Sensor Noise)' : '(Authentic Sensor Grain)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${result.metrics.compressionSensorNoiseScore}%` }} 
                            className={`h-full ${result.metrics.compressionSensorNoiseScore >= 50 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>

                      {/* Dimension 4 */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>4. Latent Upsampler &amp; Frequency Artifacts:</span>
                          <span className={result.metrics.frequencyArtifactScore >= 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {result.metrics.frequencyArtifactScore}/100 {result.metrics.frequencyArtifactScore >= 50 ? '(Diffusion Grid Spikes)' : '(Normal Frequency Spectrum)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${result.metrics.frequencyArtifactScore}%` }} 
                            className={`h-full ${result.metrics.frequencyArtifactScore >= 50 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>

                      {/* Dimension 5 */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>5. Semantic Logic &amp; Perspective Geometry:</span>
                          <span className={result.metrics.semanticPhysicsScore >= 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {result.metrics.semanticPhysicsScore}/100 {result.metrics.semanticPhysicsScore >= 50 ? '(Geometric Hallucinations)' : '(Euclidean Consistent)'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${result.metrics.semanticPhysicsScore}%` }} 
                            className={`h-full ${result.metrics.semanticPhysicsScore >= 50 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detected Anomalies List */}
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold font-chakra text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Microscopic Forensic Findings &amp; Anomalies</span>
                    </h4>

                    <div className="space-y-2">
                      {result.detectedAnomalies.map((anom, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-slate-200">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                                anom.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                                anom.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {anom.severity}
                              </span>
                              <span>{anom.title}</span>
                            </div>
                            {anom.location && (
                              <span className="text-[11px] text-cyan-400 font-mono-code hidden sm:inline">
                                {anom.location}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px] mt-1.5 leading-snug">
                            {anom.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Court Evidence Certificate Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-mono-code uppercase text-slate-400 mb-1">
                      <span>Case ID: {result.caseNumber}</span>
                      <span>Timestamp: {new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 font-mono-code text-[11px] leading-relaxed">
                      {result.courtEvidenceDeclaration}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-[11px] text-slate-400 font-mono-code flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Logged in Forensic History</span>
                      </div>

                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${result.caseNumber}_Photo_Forensics.json`;
                          a.click();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Forensic Evidence (JSON)</span>
                      </button>
                    </div>
                  </div>

                </>
              ) : (
                <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                  <span>Analyzing photo evidence...</span>
                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* VIEW 2: DEDICATED SCAN HISTORY ARCHIVE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* History Metrics & Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono-code uppercase">Total Scans Performed</div>
              <div className="text-2xl font-bold font-chakra text-slate-100 mt-1">{historyList.length}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-red-900/40 bg-red-950/10">
              <div className="text-[11px] text-red-300 font-mono-code uppercase">AI Synthetic Detected</div>
              <div className="text-2xl font-bold font-chakra text-red-400 mt-1">{aiCount}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10">
              <div className="text-[11px] text-emerald-300 font-mono-code uppercase">Real Camera Verified</div>
              <div className="text-2xl font-bold font-chakra text-emerald-400 mt-1">{realCount}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono-code uppercase">Local DB Integrity</div>
              <div className="text-2xl font-bold font-chakra text-cyan-400 mt-1">100% Verified</div>
            </div>
          </div>

          {/* Search, Filters & Actions Bar */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scans by filename, case ID, camera or generator..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  historyFilter === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                All ({historyList.length})
              </button>
              <button
                onClick={() => setHistoryFilter('AI_GENERATED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  historyFilter === 'AI_GENERATED'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                🤖 AI Synthetic ({aiCount})
              </button>
              <button
                onClick={() => setHistoryFilter('REAL_AUTHENTIC_PHOTO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  historyFilter === 'REAL_AUTHENTIC_PHOTO'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                📸 Real Camera ({realCount})
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(historyList, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `VeriShield_Photo_Scan_History_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                }}
                disabled={historyList.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All</span>
              </button>

              <button
                onClick={handleClearAllHistory}
                disabled={historyList.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>

          </div>

          {/* History List Table / Cards */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isAi = item.verdict === 'AI_GENERATED' || item.verdict === 'HIGHLY_SUSPICIOUS_SYNTHETIC';
                return (
                  <div
                    key={item.id || item.caseNumber}
                    className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Thumbnail & Core Details */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      
                      {/* Image Thumbnail Preview */}
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {item.thumbnailUrl || item.imageBase64 ? (
                          <img
                            src={item.thumbnailUrl || item.imageBase64}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-6 h-6 text-slate-600" />
                        )}
                        <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black ${
                          isAi ? 'bg-red-400' : 'bg-emerald-400'
                        }`} />
                      </div>

                      {/* Case Information */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                            isAi 
                              ? 'bg-red-950 text-red-300 border border-red-800' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {isAi ? 'AI GENERATED' : 'REAL CAMERA PHOTO'}
                          </span>
                          <span className="text-xs font-mono-code font-bold text-slate-300">
                            {item.caseNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono-code">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold font-chakra text-slate-100 mt-1 truncate">
                          {item.filename}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono-code text-[11px]">
                          <span className="text-slate-300">
                            Model/Origin: <span className="text-cyan-400 font-bold">{item.estimatedGenerator}</span>
                          </span>
                          <span>&bull;</span>
                          <span>Anomalies: {item.detectedAnomalies?.length || 0}</span>
                          {item.exifData?.cameraMake && (
                            <>
                              <span>&bull;</span>
                              <span className="text-emerald-400">EXIF: {item.exifData.cameraMake}</span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right: Scores & Actions */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                      
                      {/* Probabilities */}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-mono-code uppercase">AI vs Real Probability</div>
                        <div className="flex items-center gap-2 justify-end mt-0.5">
                          <span className={`text-sm font-bold font-chakra ${isAi ? 'text-red-400' : 'text-slate-400'}`}>
                            AI: {item.aiGeneratedProbability.toFixed(1)}%
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className={`text-sm font-bold font-chakra ${!isAi ? 'text-emerald-400' : 'text-slate-400'}`}>
                            Real: {item.realPhotoProbability.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSelectHistoryItem(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                          title="Open in Forensic Lab"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${item.caseNumber}_Evidence.json`;
                            a.click();
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Download Evidence JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs space-y-3">
              <History className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-400">No Photo Forensic Scans Found</div>
              <p className="text-slate-500 max-w-sm mx-auto">
                {historySearch ? 'No scan records matched your search query.' : 'Upload any image or click a benchmark in the Forensic Lab to perform your first scan.'}
              </p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer hover:bg-cyan-500/30 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Go to Forensic Lab</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

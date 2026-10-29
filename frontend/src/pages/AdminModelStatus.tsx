import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  HardDrive, 
  Activity, 
  Loader2, 
  RefreshCw,
  Terminal,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminModelStatus() {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchModelTelemetry = async () => {
    try {
      setLoading(true);
      const [meta, health] = await Promise.all([
        api.getModelMetadata(),
        api.getAiHealth()
      ]);
      setModelInfo(meta);
      setHealthInfo(health);
    } catch (err) {
      console.error('Failed to load model telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelTelemetry();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-navy-900 animate-spin" />
        <p className="text-sm font-medium text-gray-600">Querying AI inference engine telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PRODUCTION ENGINE
            </span>
            <span className="text-xs text-slate-400 font-medium">FAUNA-X Visual Screening Subsystem</span>
          </div>
          <h1 className="text-2xl font-black text-navy-950">AI Model Registry & Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Hardware acceleration, model weights verification, input preprocessing pipeline, and class distribution
          </p>
        </div>

        <button
          onClick={fetchModelTelemetry}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Telemetry
        </button>
      </div>

      {/* Main Model Telemetry Card */}
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-blue-950 rounded-3xl border border-navy-800 shadow-xl p-6 sm:p-8 text-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold font-mono tracking-tight text-white">
                {modelInfo?.model_name || 'faunax_livestock_vision'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Architecture: <span className="text-blue-300 font-bold">{modelInfo?.architecture || 'YOLO11n-cls'}</span> • 
              Version: <span className="text-white font-mono">{modelInfo?.version || '1.0.0'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Status: {modelInfo?.status || 'READY'}
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase font-mono">
              <Zap className="w-4 h-4 text-blue-400" />
              Device: {modelInfo?.device || healthInfo?.device || 'CUDA'}
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-navy-900/80 rounded-2xl border border-navy-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Type</span>
            <span className="text-sm font-bold text-white font-mono mt-1 capitalize block">
              {modelInfo?.task || 'Classification'}
            </span>
          </div>

          <div className="p-4 bg-navy-900/80 rounded-2xl border border-navy-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Input Tensor Size</span>
            <span className="text-sm font-bold text-white font-mono mt-1 block">
              {modelInfo?.input_size || 640} × {modelInfo?.input_size || 640} RGB
            </span>
          </div>

          <div className="p-4 bg-navy-900/80 rounded-2xl border border-navy-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Threshold</span>
            <span className="text-sm font-bold text-blue-400 font-mono mt-1 block">
              {modelInfo?.confidence_threshold ? `${(modelInfo.confidence_threshold * 100).toFixed(0)}%` : '65%'}
            </span>
          </div>

          <div className="p-4 bg-navy-900/80 rounded-2xl border border-navy-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Weight Size</span>
            <span className="text-sm font-bold text-white font-mono mt-1 block">
              {modelInfo?.file_size_mb || '3.2'} MB
            </span>
          </div>
        </div>

        {/* Supported Classes */}
        <div className="p-5 bg-navy-900/80 rounded-2xl border border-navy-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Dynamically Registered Clinical Classes ({modelInfo?.classes?.length || 3})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(modelInfo?.classes || ['fmd', 'healthy', 'lumpy_skin']).map((clsName: string, idx: number) => (
              <div key={idx} className="p-3.5 bg-navy-950 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white capitalize">{clsName.replace('_', ' ')}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Index: {idx}</div>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded-md text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Pipeline Architecture Roadmap */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-7 space-y-6">
        <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          FAUNA-X Multi-Modal Intelligence Stack Status
        </h3>

        <div className="divide-y divide-slate-100">
          {[
            { id: 'AI-01', name: 'Livestock Visual Screening', status: 'ONLINE', tech: 'PyTorch / YOLO11n-cls', desc: 'Real-time photographic lesions and clinical sign detection' },
            { id: 'AI-02', name: 'Voice-to-Symptom Dialect Parser', status: 'PLANNED', tech: 'Whisper / Indic-Wav2Vec', desc: 'Audio transcription for rural farmer dialects' },
            { id: 'AI-03', name: 'Multi-Factor Case Risk Engine', status: 'PLANNED', tech: 'XGBoost / LightGBM', desc: 'Fusion of visual screening, symptoms, and herd history' },
            { id: 'AI-04', name: 'Spatial-Temporal Outbreak Clustering', status: 'PLANNED', tech: 'DBSCAN / HDBSCAN', desc: 'Geospatial micro-cluster and transmission vector mapping' },
            { id: 'AI-05', name: 'Regional Epidemic Forecasting', status: 'PLANNED', tech: 'Prophet / LSTM', desc: 'District-level seasonal outbreak trajectory prediction' },
            { id: 'AI-06', name: 'Clinical Explainability & Saliency', status: 'PLANNED', tech: 'Grad-CAM / SHAP', desc: 'Visual attention heatmaps for veterinary confirmation' },
          ].map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{item.id}</span>
                  <span className="text-xs font-bold text-navy-950">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({item.tech})</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wide self-start sm:self-auto ${
                item.status === 'ONLINE'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

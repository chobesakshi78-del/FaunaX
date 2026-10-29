import React from 'react';
import { Layers, AlertCircle, Sparkles, Network, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClustersPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold rounded-full">
            AI-04 MODULE • PLANNED
          </span>
          <span className="text-xs text-slate-400 font-medium">FAUNA-X Spatial Engine</span>
        </div>
        <h1 className="text-2xl font-black text-navy-950">Spatial-Temporal Outbreak Cluster Analysis</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Density-based geospatial spatial clustering (DBSCAN + HDBSCAN) for early micro-hotspot detection
        </p>
      </div>

      {/* Honest Status Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-start gap-3.5">
          <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-navy-950">Spatial Cluster Analysis Module Not Connected</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              In accordance with FAUNA-X AI Safety & Data Integrity principles, synthetic or fabricated outbreak clusters are strictly forbidden. The DBSCAN spatial-temporal clustering engine will be trained on regional epidemiological density grids and connected via the endpoint below.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Contract Spec */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-navy-950 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            AI Service Contract: DBSCAN Spatial Engine
          </h2>
          <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl font-bold">
            POST /api/ai/clusters/analyze
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2.5">Planned Algorithm</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-900">• DBSCAN / HDBSCAN:</span>
                Spatial-temporal epsilon neighborhood density clustering.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-900">• Haversine Metric:</span>
                Exact geodetic distance calculations across village coordinates.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-900">• Temporal Window:</span>
                Moving 7-day and 14-day rolling incidence windows.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2.5">Target Output Schema</h4>
            <pre className="p-4 bg-navy-950 text-blue-300 rounded-2xl font-mono text-[11px] overflow-x-auto border border-navy-800">
{`{
  "clusters_found": 0,
  "status": "NOT_IMPLEMENTED",
  "active_clusters": [],
  "message": "DBSCAN spatial module planned"
}`}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Currently active AI layer:</span>
          <Link
            to="/admin/models"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            FAUNA-X Vision v1.0.0 (ONLINE)
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

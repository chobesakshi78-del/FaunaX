import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Activity, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  Loader2,
  Sparkles,
  Building2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { Case, MapCaseFeature } from '../types';
import StatCard from '../components/common/StatCard';
import MapView from '../components/map/MapView';
import RiskBadge from '../components/common/RiskBadge';

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#0ea5e9', '#10b981'];

export default function GovernmentDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [mapFeatures, setMapFeatures] = useState<MapCaseFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [casesData, mapData] = await Promise.all([
          api.getCases(),
          api.getMapCases()
        ]);
        setCases(casesData);
        if (Array.isArray(mapData)) {
          const features: MapCaseFeature[] = mapData.map(pt => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [pt.longitude, pt.latitude],
            },
            properties: {
              id: pt.id,
              case_number: pt.case_number,
              species: pt.species,
              status: pt.status,
              location_name: pt.village || pt.district || 'Field Location',
              top_prediction: pt.top_prediction,
              confidence: pt.confidence,
              created_at: pt.created_at,
            },
          }));
          setMapFeatures(features);
        } else {
          setMapFeatures((mapData as any).features || []);
        }
      } catch (err) {
        console.error('Failed to load surveillance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCases = cases.length;
  const verifiedCases = cases.filter(c => c.status === 'VERIFIED');
  const pendingCases = cases.filter(c => c.status === 'AI_SCREENED' || c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW');
  const highRiskFlags = cases.filter(c => {
    const top = c.predictions?.[0];
    return top && top.prediction_class !== 'healthy' && (top.confidence_score || 0) >= 0.7;
  });

  // Aggregate species breakdown
  const speciesCounts: Record<string, number> = {};
  cases.forEach(c => {
    speciesCounts[c.species] = (speciesCounts[c.species] || 0) + c.number_affected;
  });
  const speciesChartData = Object.keys(speciesCounts).map(name => ({
    name,
    value: speciesCounts[name]
  }));

  // Aggregate AI screening breakdown
  const aiClassCounts: Record<string, number> = {};
  cases.forEach(c => {
    const predClass = c.predictions?.[0]?.prediction_class || 'Awaiting Screening';
    const formatted = predClass.replace('_', ' ').toUpperCase();
    aiClassCounts[formatted] = (aiClassCounts[formatted] || 0) + 1;
  });
  const aiChartData = Object.keys(aiClassCounts).map(name => ({
    name,
    cases: aiClassCounts[name]
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-950">National Livestock Health Surveillance</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              DAHD / Govt of India
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time disease intelligence, spatial epidemiology, and veterinary response oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/government/clusters"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Cluster Intelligence
          </Link>
          <Link
            to="/admin/models"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            AI Model Telemetry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports Received"
          value={totalCases}
          subtitle="Field submissions"
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Clinically Verified"
          value={verifiedCases.length}
          subtitle="Confirmed outbreaks"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Pending Verification"
          value={pendingCases.length}
          subtitle="In field triage"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          title="High-Priority AI Signals"
          value={highRiskFlags.length}
          subtitle="Screening confidence ≥ 70%"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          color="rose"
        />
      </div>

      {/* Interactive GIS Surveillance Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Geospatial Outbreak Map (Live PostGIS Feed)
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {mapFeatures.length} geo-referenced cases tracked
          </span>
        </div>
        <MapView features={mapFeatures} height="480px" />
      </div>

      {/* Surveillance Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Screening Distribution Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              AI Visual Screening Class Frequency
            </h3>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">FAUNA-X Vision v1.0.0</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f233d', borderRadius: '12px', color: '#fff', fontSize: '12px', border: '1px solid #1e4575' }}
                />
                <Bar dataKey="cases" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species Distribution Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              Affected Livestock Species Distribution
            </h3>
            <span className="text-[11px] font-medium text-slate-400">Total heads impacted</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speciesChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {speciesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f233d', borderRadius: '12px', color: '#fff', fontSize: '12px', border: '1px solid #1e4575' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* District Case Hierarchy Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-950">Active Field Surveillance Cases</h3>
          <span className="text-xs text-slate-500 font-semibold">{cases.length} total records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Case Number</th>
                <th className="py-3 px-4">Species</th>
                <th className="py-3 px-4">AI Visual Screening</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.slice(0, 10).map((c) => {
                const top = c.predictions?.[0];
                return (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy-950">{c.case_number}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{c.species} ({c.number_affected})</td>
                    <td className="py-3 px-4 capitalize font-semibold text-blue-900">
                      {top ? top.prediction_class.replace('_', ' ') : 'Pending'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {top ? `${(top.confidence_score * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{c.location_name || `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}`}</td>
                    <td className="py-3 px-4">
                      <RiskBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/cases/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        View File →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

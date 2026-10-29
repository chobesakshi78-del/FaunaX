import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Activity,
  MapPin,
  Stethoscope,
  Radio,
  FileCheck,
  Smartphone,
  Cpu,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const steps = [
    { num: '01', title: 'Field Signals', desc: 'Farmers and field workers capture photographs, symptoms, voice, and GPS coordinates.', icon: Smartphone },
    { num: '02', title: 'AI Screening Engine', desc: 'Edge vision models perform high-speed visual health screening and extract lesion indicators.', icon: Cpu },
    { num: '03', title: 'Outbreak Intelligence', desc: 'Downstream fusion models analyze spatial-temporal patterns for early cluster detection.', icon: Radio },
    { num: '04', title: 'Veterinary Verification', desc: 'Registered veterinary medical officers clinically audit and verify field alerts.', icon: Stethoscope },
    { num: '05', title: 'Early Field Response', desc: 'Coordinated ring vaccination, lab sampling, and herd containment directives.', icon: FileCheck },
    { num: '06', title: 'Continuous Monitoring', desc: 'State and district authorities track syndromic disease trajectories on GIS maps.', icon: Layers },
  ];

  const features = [
    { title: 'Offline-First Farmer Reporting', desc: 'Submit health alerts directly from remote barns with local caching and auto-sync when online.', icon: Smartphone },
    { title: 'AI-Assisted Visual Screening', desc: 'Fine-tuned deep learning models screen for cutaneous nodules and vesicular mucosal indicators.', icon: Cpu },
    { title: 'Geospatial GIS Intelligence', desc: 'Real-time epidemiological mapping of suspect cases across administrative district hierarchies.', icon: MapPin },
    { title: 'Veterinary Verification Portal', desc: 'Structured clinical workflows ensuring AI never acts as an unverified autonomous diagnostic tool.', icon: Stethoscope },
    { title: 'Outbreak Cluster Detection', desc: 'Prepared interfaces for spatial-temporal density clustering and early hotspot detection.', icon: Layers },
    { title: 'Case-to-Closure Tracking', desc: 'End-to-end case accountability from farmer report to veterinary treatment and resolution.', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top SIH Header Banner */}
      <div className="bg-navy-900 border-b border-navy-800 text-[11px] text-blue-100 py-2 px-4 text-center">
        <span className="font-bold text-blue-300 mr-2 bg-blue-800/80 px-2 py-0.5 rounded">Smart India Hackathon 2026</span>
        Problem Statement SIH26128: Efficient systems for early detection, prevention, and management of livestock diseases.
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>FAUNA-X Livestock Health Surveillance Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-950 leading-tight">
            From Field Signals to <span className="text-blue-600">Faster Animal Health Response</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            An intelligent livestock health surveillance platform combining rural field reporting, AI-assisted visual screening, geospatial intelligence, and registered veterinary verification.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/farmer/report"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 group"
            >
              <span>Report Animal Health Issue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/government/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 font-bold text-sm border border-blue-200 shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Surveillance GIS</span>
            </Link>
          </div>
        </div>

        {/* Hero Architecture Flow Diagram */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-card">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              End-to-End Surveillance Pipeline
            </span>
            <h2 className="text-lg font-bold text-navy-950 mt-1">How FAUNA-X Accelerates Outbreak Response</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">{s.num}</span>
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-navy-950">{s.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">Integrated Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
              Built for Farmers, Veterinarians, and State Epidemiologists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-blue-300 hover:shadow-card-hover hover:bg-white transition-all space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy-950">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mandatory Regulatory & Clinical Safety Notice */}
      <section className="py-10 bg-slate-100/70 border-t border-slate-200 px-4">
        <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-white border border-amber-200 text-amber-900 text-xs flex items-start space-x-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
              Clinical Ethics & Veterinary Verification Protocol
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              FAUNA-X is an AI-assisted visual screening system designed for early warning and field triage. It is <strong>NOT a substitute for clinical veterinary diagnosis</strong>. All flagged health indicators require on-site examination by a registered veterinary professional before medical treatments or quarantines are executed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">FAUNA-X: National Livestock Health Intelligence & Response System</p>
        <p className="mt-1 text-[11px] text-slate-400">Smart India Hackathon 2026 | Department of Animal Husbandry & Dairying (DAHD)</p>
      </footer>
    </div>
  );
};

export default LandingPage;

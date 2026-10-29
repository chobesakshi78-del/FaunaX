import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Stethoscope,
  Map,
  Layers,
  Cpu,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const farmerLinks = [
    { to: '/farmer/dashboard', label: 'My Herd Dashboard', icon: LayoutDashboard },
    { to: '/farmer/report', label: 'Report Health Issue', icon: PlusCircle },
  ];

  const vetLinks = [
    { to: '/vet/dashboard', label: 'Clinical Triage', icon: Stethoscope },
    { to: '/farmer/report', label: 'New Field Case', icon: PlusCircle },
    { to: '/vet/clusters', label: 'Spatial Clusters', icon: Layers },
  ];

  const govtLinks = [
    { to: '/government/dashboard', label: 'Surveillance GIS', icon: Map },
    { to: '/government/clusters', label: 'Outbreak Clusters', icon: Layers },
    { to: '/admin/models', label: 'AI Model Telemetry', icon: Cpu },
  ];

  const adminLinks = [
    { to: '/government/dashboard', label: 'Surveillance GIS', icon: Map },
    { to: '/vet/dashboard', label: 'Clinical Triage', icon: Stethoscope },
    { to: '/farmer/dashboard', label: 'Farmer View', icon: LayoutDashboard },
    { to: '/farmer/report', label: 'Report Issue', icon: PlusCircle },
    { to: '/admin/models', label: 'AI Architecture', icon: Cpu },
  ];

  let currentLinks = farmerLinks;
  if (role === 'VETERINARIAN') currentLinks = vetLinks;
  if (role === 'GOVERNMENT') currentLinks = govtLinks;
  if (role === 'ADMIN') currentLinks = adminLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-white text-slate-700 z-50 flex flex-col border-r border-slate-200 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between lg:hidden">
          <span className="font-bold text-navy-950 text-sm">Navigation Menu</span>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-navy-950">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</div>
          <div className="text-sm font-bold text-blue-700 mt-0.5">
            {role === 'FARMER' && '🌾 Farmer Health Desk'}
            {role === 'VETERINARIAN' && '🩺 Veterinary Verification'}
            {role === 'GOVERNMENT' && '🏛️ State Surveillance Unit'}
            {role === 'ADMIN' && '⚡ System Administrator'}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-navy-950'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* SIH Governance Footer */}
        <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50/90">
          <div className="flex items-center space-x-1.5 text-blue-900 font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>SIH26128 Compliance</span>
          </div>
          <p className="leading-tight text-[10px] text-slate-500">
            AI-assisted field screening. All clinical actions mandate registered veterinary verification.
          </p>
        </div>
      </aside>
    </>
  );
};

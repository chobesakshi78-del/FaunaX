import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, PlusCircle, Stethoscope, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 text-slate-600 flex justify-around items-center py-2 px-2 shadow-lg">
      {role === 'FARMER' && (
        <>
          <NavLink
            to="/farmer/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink
            to="/farmer/report"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 text-[11px] font-bold rounded-full ${
                isActive ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
              } -translate-y-3 shadow-md shadow-blue-500/30`
            }
          >
            <PlusCircle className="w-5 h-5 mb-0.5" />
            <span>+ {t('farmer.quickReport')}</span>
          </NavLink>
        </>
      )}

      {role === 'VETERINARIAN' && (
        <>
          <NavLink
            to="/vet/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Stethoscope className="w-5 h-5 mb-0.5" />
            <span>{t('vet.triageWorklist')}</span>
          </NavLink>
          <NavLink
            to="/farmer/report"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 text-[11px] font-bold rounded-full bg-blue-600 text-white -translate-y-3 shadow-md shadow-blue-500/30`
            }
          >
            <PlusCircle className="w-5 h-5 mb-0.5" />
            <span>+ {t('nav.reportDisease')}</span>
          </NavLink>
        </>
      )}

      {role === 'FIELD_OFFICER' && (
        <>
          <NavLink
            to="/field/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>{t('field.assignedCases')}</span>
          </NavLink>
          <NavLink
            to="/farmer/report"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-4 text-[11px] font-bold rounded-full bg-amber-600 text-white -translate-y-3 shadow-md shadow-amber-500/30`
            }
          >
            <PlusCircle className="w-5 h-5 mb-0.5" />
            <span>+ {t('nav.reportDisease')}</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};

export default MobileBottomNav;

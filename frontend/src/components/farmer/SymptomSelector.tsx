import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import { CaseSymptom } from '../../types';

interface PresetSymptom {
  id: string;
  labelKey: string;
  defaultLabel: string;
}

const PRESET_SYMPTOMS: PresetSymptom[] = [
  { id: 'skinNodules', labelKey: 'symptoms.skinNodules', defaultLabel: 'Skin lesions / nodules' },
  { id: 'fever', labelKey: 'symptoms.fever', defaultLabel: 'Fever / high temperature' },
  { id: 'appetiteLoss', labelKey: 'symptoms.appetiteLoss', defaultLabel: 'Loss of appetite / stopped eating' },
  { id: 'salivation', labelKey: 'symptoms.salivation', defaultLabel: 'Salivation / frothing at mouth' },
  { id: 'lameness', labelKey: 'symptoms.lameness', defaultLabel: 'Lameness / difficulty walking' },
  { id: 'milkDrop', labelKey: 'symptoms.milkDrop', defaultLabel: 'Reduced milk yield' },
  { id: 'nasalDischarge', labelKey: 'symptoms.nasalDischarge', defaultLabel: 'Nasal discharge' },
  { id: 'respiratoryDistress', labelKey: 'symptoms.respiratoryDistress', defaultLabel: 'Coughing / breathing difficulty' },
  { id: 'udderMastitis', labelKey: 'symptoms.udderMastitis', defaultLabel: 'Udder swelling / mastitis' },
  { id: 'diarrhea', labelKey: 'symptoms.diarrhea', defaultLabel: 'Diarrhea' },
  { id: 'weakness', labelKey: 'symptoms.weakness', defaultLabel: 'Weakness / recumbency' },
  { id: 'eyeDischarge', labelKey: 'symptoms.eyeDischarge', defaultLabel: 'Eye discharge / lacrimation' },
  { id: 'unusualBehavior', labelKey: 'symptoms.unusualBehavior', defaultLabel: 'Unusual behavior / dullness' },
  { id: 'visibleWounds', labelKey: 'symptoms.visibleWounds', defaultLabel: 'Visible wounds / lesions' },
];

interface SymptomSelectorProps {
  selectedSymptoms?: string[];
  symptoms?: (string | CaseSymptom)[];
  onChange: (symptoms: any) => void;
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({ 
  selectedSymptoms, 
  symptoms = [], 
  onChange 
}) => {
  const { t } = useTranslation();
  const [customInput, setCustomInput] = useState('');

  // Normalize current items to string array
  const currentList: string[] = selectedSymptoms 
    ? selectedSymptoms 
    : symptoms.map(s => typeof s === 'string' ? s : s.symptom_name);

  // Check if a preset is active in any language
  const isPresetSelected = (item: PresetSymptom) => {
    const localizedLabel = t(item.labelKey, item.defaultLabel);
    return currentList.some((s) => {
      const lower = s.toLowerCase().trim();
      return (
        lower === item.id.toLowerCase() ||
        lower === item.defaultLabel.toLowerCase() ||
        lower === localizedLabel.toLowerCase()
      );
    });
  };

  const togglePreset = (item: PresetSymptom) => {
    const localizedLabel = t(item.labelKey, item.defaultLabel);
    if (isPresetSelected(item)) {
      const updated = currentList.filter((s) => {
        const lower = s.toLowerCase().trim();
        return !(
          lower === item.id.toLowerCase() ||
          lower === item.defaultLabel.toLowerCase() ||
          lower === localizedLabel.toLowerCase()
        );
      });
      onChange(updated);
    } else {
      // Store the localized label corresponding to current user session
      const updated = [...currentList, localizedLabel];
      onChange(updated);
    }
  };

  const isCustomSelected = (name: string) =>
    currentList.some((s) => s.toLowerCase().trim() === name.toLowerCase().trim());

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!isCustomSelected(trimmed)) {
      const updated = [...currentList, trimmed];
      onChange(updated);
    }
    setCustomInput('');
  };

  // Get custom symptoms that are not in preset list
  const customItems = currentList.filter(s => {
    return !PRESET_SYMPTOMS.some(p => {
      const lower = s.toLowerCase().trim();
      const loc = t(p.labelKey, p.defaultLabel).toLowerCase();
      return lower === p.id.toLowerCase() || lower === p.defaultLabel.toLowerCase() || lower === loc;
    });
  });

  const removeCustom = (item: string) => {
    const updated = currentList.filter(s => s !== item);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Preset Symptom Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRESET_SYMPTOMS.map((sym) => {
          const active = isPresetSelected(sym);
          const label = t(sym.labelKey, sym.defaultLabel);
          return (
            <button
              key={sym.id}
              type="button"
              onClick={() => togglePreset(sym)}
              className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                active
                  ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="truncate pr-1">{label}</span>
              {active && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Selected Custom Symptoms Tags */}
      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customItems.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 shadow-2xs"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeCustom(item)}
                className="hover:text-rose-600 font-extrabold ml-1"
                aria-label={`Remove ${item}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add Custom Symptom in Marathi, Hindi, or English */}
      <form onSubmit={addCustom} className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={t('symptoms.addCustomPlaceholder')}
          className="flex-1 rounded-2xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          <span>{t('symptoms.add')}</span>
        </button>
      </form>
    </div>
  );
};

export default SymptomSelector;

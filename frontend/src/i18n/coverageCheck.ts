import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

interface CoverageResult {
  locale: string;
  totalKeys: number;
  missingKeys: string[];
  coveragePercentage: number;
}

function getObjectKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getObjectKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

export function runTranslationCoverageCheck(): {
  enKeysCount: number;
  mrCoverage: CoverageResult;
  hiCoverage: CoverageResult;
  isComplete: boolean;
} {
  const enKeys = getObjectKeys(en);
  const mrKeys = new Set(getObjectKeys(mr));
  const hiKeys = new Set(getObjectKeys(hi));

  const mrMissing = enKeys.filter(k => !mrKeys.has(k));
  const hiMissing = enKeys.filter(k => !hiKeys.has(k));

  const mrCoverage: CoverageResult = {
    locale: 'mr (Marathi)',
    totalKeys: enKeys.length,
    missingKeys: mrMissing,
    coveragePercentage: Number((((enKeys.length - mrMissing.length) / enKeys.length) * 100).toFixed(1))
  };

  const hiCoverage: CoverageResult = {
    locale: 'hi (Hindi)',
    totalKeys: enKeys.length,
    missingKeys: hiMissing,
    coveragePercentage: Number((((enKeys.length - hiMissing.length) / enKeys.length) * 100).toFixed(1))
  };

  return {
    enKeysCount: enKeys.length,
    mrCoverage,
    hiCoverage,
    isComplete: mrMissing.length === 0 && hiMissing.length === 0
  };
}

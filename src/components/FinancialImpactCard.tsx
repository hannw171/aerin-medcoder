import React, { useEffect, useState } from 'react';
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from '@/utils/pricing';
import { CodeItem } from '@/components/SearchableICDInput';

interface FinancialImpactCardProps {
  primaryDiagnosis: CodeItem | null;
  secondaryDiagnoses: CodeItem[];
  procedures: CodeItem[];
  potentialFindings: { description: string; insight: string }[];
}

export function FinancialImpactCard({
  primaryDiagnosis,
  secondaryDiagnoses,
  procedures,
  potentialFindings
}: FinancialImpactCardProps) {
  const [animate, setAnimate] = useState(false);

  const pCode = primaryDiagnosis?.code || '';
  const currentSeverity = determineSeverityLevel(secondaryDiagnoses, potentialFindings);
  const currentTariff = getEstimatedTariff(pCode, currentSeverity, procedures);

  const baselineTariff = getEstimatedTariff(pCode, 1, procedures);
  
  // Biaya Riil RS approx 80% of Baseline (Level 1)
  const biayaRiil = baselineTariff > 0 ? baselineTariff * 0.8 : 0;
  const margin = currentTariff - biayaRiil;
  const optimizationGain = currentTariff - baselineTariff;

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [currentTariff, margin]);

  if (!primaryDiagnosis) return null;

  return (
    <div className="bg-white rounded-lg border border-outline-variant p-4 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <h3 className="font-title-md text-title-md text-on-surface">Analisis Efisiensi Klaim</h3>
        <span className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded">
          RS Kelas C - Regional 1
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Estimasi Tarif INA-CBG</span>
          <span className={`font-title-lg text-title-lg text-on-surface transition-colors duration-500 ${animate ? 'text-primary' : ''}`}>
            {formatIDR(currentTariff)}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Level {currentSeverity}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Biaya Riil RS (Est)</span>
          <span className="font-title-md text-title-md text-on-surface-variant">
            {formatIDR(biayaRiil)}
          </span>
        </div>
      </div>

      <div className="w-full h-px bg-outline-variant"></div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="font-label-md text-label-md text-on-surface-variant">Baseline (Level 1)</span>
          <span className="font-body-md text-body-md text-on-surface">{formatIDR(baselineTariff)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-label-md text-label-md text-on-surface-variant">Optimization Gain</span>
          <span className={`font-body-md text-body-md ${optimizationGain > 0 ? 'text-emerald-600' : 'text-on-surface-variant'} transition-colors duration-500 ${animate ? 'font-bold' : ''}`}>
            +{formatIDR(optimizationGain)}
          </span>
        </div>
      </div>

      <div className={`p-3 rounded-md flex justify-between items-center transition-colors duration-500 ${margin >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
        <span className={`font-title-sm text-title-sm ${margin >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
          Margin Efisiensi
        </span>
        <span className={`font-title-md text-title-md transition-colors duration-500 ${animate ? 'scale-105' : ''} ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {margin >= 0 ? '+' : ''}{formatIDR(margin)}
        </span>
      </div>
    </div>
  );
}

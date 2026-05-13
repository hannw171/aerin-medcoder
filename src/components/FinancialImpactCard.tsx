import React, { useEffect, useState } from 'react';
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from '@/utils/pricing';
import { CodeItem } from '@/components/SearchableICDInput';
import { motion, AnimatePresence } from 'framer-motion';
import NumberTicker from '@/components/NumberTicker';

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-bold text-on-surface">Analisis Efisiensi Klaim</h3>
          <p className="text-xs text-on-surface-variant font-medium">RS Kelas C - Regional 1</p>
        </div>
        <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">payments</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Estimasi Tarif INA-CBG</span>
          <div className={`text-xl font-display font-bold text-on-surface transition-colors duration-300 ${animate ? 'text-primary' : ''}`}>
            <NumberTicker value={currentTariff} />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${currentSeverity === 3 ? 'bg-rose-500' : currentSeverity === 2 ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Severity Level {currentSeverity}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Biaya Riil RS (Est)</span>
          <div className="text-lg font-display font-bold text-slate-500">
            <NumberTicker value={biayaRiil} />
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1 font-medium italic">Simulasi 80% Baseline</span>
        </div>
      </div>

      <div className="w-full h-px bg-outline-variant/50"></div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-medium text-on-surface-variant">Baseline (Level 1)</span>
          <span className="text-sm font-bold text-on-surface">{formatIDR(baselineTariff)}</span>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-medium text-on-surface-variant">Optimization Gain</span>
          <span className={`text-sm font-bold ${optimizationGain > 0 ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
            {optimizationGain > 0 ? '+' : ''}{formatIDR(optimizationGain)}
          </span>
        </div>
      </div>

      <motion.div 
        animate={animate ? { scale: [1, 1.02, 1] } : {}}
        className={`p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${margin >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}
      >
        <div className="flex flex-col">
          <span className={`text-xs font-bold uppercase tracking-wider ${margin >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            Margin Efisiensi
          </span>
          <span className={`text-[10px] ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {margin >= 0 ? 'Surplus Operasional' : 'Defisit Operasional'}
          </span>
        </div>
        <div className={`text-lg font-display font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          <NumberTicker value={margin} />
        </div>
      </motion.div>
    </motion.div>
  );
}

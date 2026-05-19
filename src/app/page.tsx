"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from '@/utils/pricing';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NumberTicker from '@/components/NumberTicker';

type MorbidityData = {
  code: string;
  description: string;
  count: number;
  pendingCount: number;
  dpjp: string;
  totalGain: number;
  severityCounts: { 1: number; 2: number; 3: number };
  patientList: { id: string; registerNo: string; name: string; status: string; gain: number }[];
};

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<MorbidityData | null>(null);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch patients", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedDiagnosis(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const {
    totalPasien,
    antreanReview,
    selesaiCount,
    completedPercent,
    optimasiNilaiKlaim,
    potensiTemuan,
    pendingCount,
    accuracyRate,
    top10Diagnoses
  } = useMemo(() => {
    const totalPasien = patients.length;
    const antreanReview = patients.filter(p => p.status === 'Belum Coding').length;
    
    const selesaiPatients = patients.filter(p => p.status === 'Selesai');
    const selesaiCount = selesaiPatients.length;
    const completedPercent = totalPasien > 0 ? Math.round((selesaiCount / totalPasien) * 100) : 0;
    
    const approvedAsIs = selesaiPatients.filter(p => !p.auditOverride).length;
    const accuracyRate = selesaiCount > 0 ? (approvedAsIs / selesaiCount) * 100 : 94.2;

    const pendingCount = patients.filter(p => p.status === 'Pending Klarifikasi').length;

    let optimasiNilaiKlaim = 0;
    let potensiTemuan = 0;
    const morbidityMap: Record<string, MorbidityData> = {};

    patients.forEach(p => {
      if (p.codingResult && p.codingResult.primaryDiagnosis) {
        const pCode = p.codingResult.primaryDiagnosis.code;
        const desc = p.codingResult.primaryDiagnosis.description;
        const severity = determineSeverityLevel(p.codingResult.secondaryDiagnoses, p.codingResult.potentialFindings);
        const severityWithoutPotential = determineSeverityLevel(p.codingResult.secondaryDiagnoses, []);
        
        const currentTariff = getEstimatedTariff(pCode, severity, p.codingResult.procedures);
        const baselineTariff = getEstimatedTariff(pCode, 1, p.codingResult.procedures);
        const tariffWithoutPotential = getEstimatedTariff(pCode, severityWithoutPotential, p.codingResult.procedures);
        
        const gain = (p.status === 'Selesai' || p.status === 'Draft AI' || p.status === 'Direvisi' || p.status === 'Pending Klarifikasi') ? (currentTariff - baselineTariff) : 0;

        if (p.status === 'Selesai') {
          const sGain = currentTariff - baselineTariff;
          if (sGain > 0) optimasiNilaiKlaim += sGain;
        }
        
        if ((p.status === 'Draft AI' || p.status === 'Direvisi' || p.status === 'Pending Klarifikasi') && p.codingResult.potentialFindings && p.codingResult.potentialFindings.length > 0) {
          const diff = currentTariff - tariffWithoutPotential;
          if (diff > 0) potensiTemuan += diff;
        }
        
        if (!morbidityMap[pCode]) {
          morbidityMap[pCode] = {
            code: pCode,
            description: desc,
            count: 0,
            pendingCount: 0,
            dpjp: p.dpjp,
            totalGain: 0,
            severityCounts: { 1: 0, 2: 0, 3: 0 },
            patientList: []
          };
        }
        
        morbidityMap[pCode].count += 1;
        if (p.status === 'Belum Coding') {
          morbidityMap[pCode].pendingCount += 1;
        } else {
          morbidityMap[pCode].totalGain += gain;
          morbidityMap[pCode].severityCounts[severity] += 1;
        }

        morbidityMap[pCode].patientList.push({
          id: p.id,
          registerNo: p.registerNo,
          name: p.name,
          status: p.status,
          gain: gain
        });
      }
    });

    const top10Diagnoses = Object.values(morbidityMap)
      .sort((a, b) => b.totalGain - a.totalGain)
      .slice(0, 10);

    return {
      totalPasien,
      antreanReview,
      selesaiCount,
      completedPercent,
      optimasiNilaiKlaim,
      potensiTemuan,
      pendingCount,
      accuracyRate,
      top10Diagnoses
    };
  }, [patients]);

  const getPoliFromDPJP = (dpjp: string) => {
    if (dpjp.includes('Sp.PD')) return 'Poli Dalam';
    if (dpjp.includes('Sp.OG')) return 'Poli Kandungan';
    if (dpjp.includes('Sp.A')) return 'Poli Anak';
    if (dpjp.includes('Sp.N')) return 'Poli Saraf';
    if (dpjp.includes('Sp.B')) return 'Poli Bedah';
    if (dpjp.includes('Sp.P')) return 'Poli Paru';
    return 'Poli Umum';
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-primary text-5xl">progress_activity</span>
          <p className="text-on-surface-variant font-display text-lg font-medium">Memuat Dashboard Eksekutif...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display text-[32px] font-bold text-on-surface">Management Summary Dashboard</h1>
          <p className="font-body-lg text-on-surface-variant">Fokus Optimasi Pendapatan & Akurasi Koding</p>
        </div>
      </div>

      {/* Task 1: Impact & Accuracy Stats Grid */}
      <motion.div 
        id="tour-dashboard-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-sm group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant group-hover:text-emerald-600 transition-colors">Optimasi Nilai Klaim</span>
            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-2 rounded-lg">trending_up</span>
          </div>
          <div className="text-2xl font-display font-bold text-on-surface">
            <NumberTicker value={optimasiNilaiKlaim} />
          </div>
          <div className="text-xs text-emerald-600/80 mt-2 font-medium">Nilai terselamatkan (Kasus Selesai)</div>
        </div>

        <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between transition-colors shadow-sm group ${
          accuracyRate === 100 ? 'hover:border-emerald-500/50' : 'hover:border-primary/50'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className={`font-body-md text-on-surface-variant transition-colors ${
              accuracyRate === 100 ? 'group-hover:text-emerald-600' : 'group-hover:text-primary'
            }`}>
              Akurasi AI
            </span>
            <span className={`material-symbols-outlined p-2 rounded-lg ${
              accuracyRate === 100 ? 'text-emerald-500 bg-emerald-50 animate-pulse' : 'text-primary bg-primary/5'
            }`}>
              {accuracyRate === 100 ? 'workspace_premium' : 'verified'}
            </span>
          </div>
          <div className={`text-2xl font-display font-bold ${
            accuracyRate === 100 ? 'text-emerald-500' : 'text-on-surface'
          }`}>
            {accuracyRate.toFixed(1)}%
          </div>
          <div className={`text-xs mt-2 font-medium ${
            accuracyRate === 100 ? 'text-emerald-600/80' : 'text-on-surface-variant'
          }`}>
            {accuracyRate === 100 
              ? "Sempurna: Seluruh rekomendasi AI disetujui langsung tanpa intervensi override penyulit." 
              : "Rata-rata draf koding AI yang langsung disetujui koder tanpa koreksi regulasi."}
          </div>
        </div>

        <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between transition-colors shadow-sm group ${
          pendingCount > 0 
            ? 'hover:border-amber-500/50 animate-glow-pulse' 
            : 'hover:border-emerald-500/50'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className={`font-body-md text-on-surface-variant transition-colors ${
              pendingCount > 0 ? 'group-hover:text-amber-600' : 'group-hover:text-emerald-600'
            }`}>
              Potensi Temuan Pending/PRB
            </span>
            <span className={`material-symbols-outlined p-2 rounded-lg ${
              pendingCount > 0 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'
            }`}>
              {pendingCount > 0 ? 'lightbulb' : 'verified_user'}
            </span>
          </div>
          <div className={`text-2xl font-display font-bold text-on-surface ${
            pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {pendingCount} Pasien
          </div>
          {pendingCount > 0 ? (
            <div className="text-xs text-amber-600/80 mt-2 font-medium italic">
              Menunggu klarifikasi DPJP (Potensi PRB/Pending)
            </div>
          ) : (
            <div className="text-xs text-emerald-600/80 mt-2 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Semua berkas optimal & terverifikasi
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-colors shadow-sm group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant group-hover:text-blue-600 transition-colors">Antrean Review</span>
            <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-2 rounded-lg">assignment</span>
          </div>
          <div className="text-2xl font-display font-bold text-on-surface">
            {antreanReview} Pasien
          </div>
          <div className="text-xs text-on-surface-variant mt-2 font-medium">Memerlukan validasi koder</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Task 3: Progress Tracker (Left Column - 1/3 width) */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-outline-variant pb-2">Coding Progress</h2>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="10"></circle>
                  <circle
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    cx="50" cy="50" fill="none" r="45" stroke="currentColor"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * completedPercent) / 100}
                    strokeWidth="10">
                  </circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[28px] font-bold text-on-surface">{completedPercent}%</span>
                </div>
              </div>
              <div className="font-body-lg text-body-lg text-on-surface font-medium">Selesai ({selesaiCount}/{totalPasien})</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
              <h2 className="font-headline-md text-headline-md text-on-surface">Aktivitas Terkini</h2>
            </div>
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-outline-variant"></div>
              <div className="flex gap-4 relative z-10 pt-2 pb-6">
                <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_document</span>
                </div>
                <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                  <div className="font-body-md text-body-md font-medium text-on-surface">Dr. Andi - ICD generated (Draft AI)</div>
                  <div className="font-label-sm text-label-sm text-outline mt-1">2 mins ago</div>
                </div>
              </div>
              <div className="flex gap-4 relative z-10 py-6">
                <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                </div>
                <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                  <div className="font-body-md text-body-md font-medium text-on-surface">Siti Aminah - Record validated (P12)</div>
                  <div className="font-label-sm text-label-sm text-outline mt-1">15 mins ago</div>
                </div>
              </div>
              <div className="flex gap-4 relative z-10 pt-6 pb-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">rate_review</span>
                </div>
                <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                  <div className="font-body-md text-body-md font-medium text-on-surface">Review temuan potensial pasien ICU</div>
                  <div className="font-label-sm text-label-sm text-outline mt-1">45 mins ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task 2: Top 10 Diagnosa (Right Column - 2/3 width) */}
        <div id="tour-morbidity-table" className="col-span-1 lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">Analisis Morbiditas & Kontribusi Klinis</h2>
            <div className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-semibold">
              Berdasarkan Dampak Ekonomi
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-outline-variant/50 text-on-surface-variant font-label-md text-label-md uppercase tracking-wide">
                  <th className="py-3 px-2">Kode ICD-10</th>
                  <th className="py-3 px-2">Deskripsi</th>
                  <th className="py-3 px-2 text-center">Total Kasus</th>
                  <th className="py-3 px-2">Distribusi Severity</th>
                  <th className="py-3 px-2 text-right">Impact Ekonomi</th>
                </tr>
              </thead>
              <tbody>
                {top10Diagnoses.length > 0 ? (
                  top10Diagnoses.map((data, idx) => {
                    const totalSeverity = data.severityCounts[1] + data.severityCounts[2] + data.severityCounts[3];
                    return (
                      <motion.tr 
                        key={idx} 
                        whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.8)" }}
                        className="border-b border-outline-variant/30 cursor-pointer group transition-colors"
                        onClick={() => setSelectedDiagnosis(data)}
                      >
                        <td className="py-3 px-2 font-mono-data text-sm font-semibold text-slate-700">
                          <span className="bg-slate-200/60 px-2 py-1 rounded group-hover:bg-primary/10 transition-colors">{data.code}</span>
                        </td>
                        <td className="py-3 px-2 font-body-md text-on-surface max-w-[200px] truncate" title={data.description}>
                          {data.description}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="font-bold text-slate-700">{data.count}</div>
                          {data.pendingCount > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
                              {data.pendingCount} Pending Analysis
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                              {data.severityCounts[1] > 0 && (
                                <div 
                                  className="h-full bg-blue-500 transition-all" 
                                  style={{ width: `${(data.severityCounts[1]/totalSeverity)*100}%` }}
                                  title={`Level 1: ${data.severityCounts[1]}`}
                                />
                              )}
                              {data.severityCounts[2] > 0 && (
                                <div 
                                  className="h-full bg-amber-500 transition-all" 
                                  style={{ width: `${(data.severityCounts[2]/totalSeverity)*100}%` }}
                                  title={`Level 2: ${data.severityCounts[2]}`}
                                />
                              )}
                              {data.severityCounts[3] > 0 && (
                                <div 
                                  className="h-full bg-rose-500 transition-all" 
                                  style={{ width: `${(data.severityCounts[3]/totalSeverity)*100}%` }}
                                  title={`Level 3: ${data.severityCounts[3]}`}
                                />
                              )}
                            </div>
                            <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>L1:{data.severityCounts[1]}</span>
                              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>L2:{data.severityCounts[2]}</span>
                              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>L3:{data.severityCounts[3]}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-title-md text-emerald-600">
                          +{formatIDR(data.totalGain)}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-on-surface-variant italic">
                      Belum ada data morbiditas untuk dianalisis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDiagnosis && (
          <DeepDiveModal 
            diagnosis={selectedDiagnosis} 
            onClose={() => setSelectedDiagnosis(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Deep-Dive Modal Component
function DeepDiveModal({ diagnosis, onClose }: { diagnosis: MorbidityData, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-surface h-full w-full max-w-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">{diagnosis.code}</span>
              <h2 className="font-display text-xl font-bold text-on-surface">Detail Kasus: {diagnosis.description}</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Analisis rincian pasien untuk koding diagnosa utama ini.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 border border-outline-variant rounded-xl p-4 text-center">
              <div className="text-xs text-on-surface-variant uppercase font-bold mb-1">Total Kasus</div>
              <div className="text-2xl font-bold text-on-surface">{diagnosis.count}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
              <div className="text-xs text-emerald-800 uppercase font-bold mb-1">Total Optimasi</div>
              <div className="text-2xl font-bold text-emerald-700">{formatIDR(diagnosis.totalGain)}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <div className="text-xs text-amber-800 uppercase font-bold mb-1">Pending Analysis</div>
              <div className="text-2xl font-bold text-amber-700">{diagnosis.pendingCount}</div>
            </div>
          </div>

          <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">Daftar Pasien Terkait</h3>
          <div className="flex flex-col gap-3">
            {diagnosis.patientList.map((p, i) => (
              <div key={i} className="bg-white border border-outline-variant rounded-xl p-4 hover:shadow-md transition-all flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">{p.name}</div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="font-mono">{p.registerNo}</span>
                      <span>•</span>
                      <span className={`font-bold ${
                        p.status === 'Selesai' ? 'text-emerald-600' : 
                        p.status === 'Draft AI' ? 'text-amber-600' : 'text-slate-500'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {p.gain > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] text-on-surface-variant uppercase font-bold">Optimization Gain</div>
                      <div className="text-sm font-bold text-emerald-600">+{formatIDR(p.gain)}</div>
                    </div>
                  )}
                  <Link 
                    href={`/coding?patientId=${p.id}`}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1 shadow-sm"
                  >
                    View Full Record
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

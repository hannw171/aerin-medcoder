import { getPatients } from '@/lib/mockDb';
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from '@/utils/pricing';
import Link from 'next/link';

export default function DashboardPage() {
  const patients = getPatients();
  
  const totalPasien = patients.length;
  const antreanReview = patients.filter(p => p.status === 'Draft AI').length;
  const selesaiCount = patients.filter(p => p.status === 'Selesai').length;
  const completedPercent = totalPasien > 0 ? Math.round((selesaiCount / totalPasien) * 100) : 0;
  
  let optimasiNilaiKlaim = 0;
  let potensiTemuan = 0;
  
  type MorbidityData = {
    code: string;
    description: string;
    count: number;
    dpjp: string;
    totalGain: number;
  };
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
      
      if (p.status === 'Selesai') {
        const gain = currentTariff - baselineTariff;
        if (gain > 0) optimasiNilaiKlaim += gain;
      }
      
      if (p.status === 'Draft AI' && p.codingResult.potentialFindings && p.codingResult.potentialFindings.length > 0) {
        const diff = currentTariff - tariffWithoutPotential;
        if (diff > 0) potensiTemuan += diff;
      }
      
      if (p.status === 'Selesai' || p.status === 'Draft AI') {
        const gain = currentTariff - baselineTariff;
        if (!morbidityMap[pCode]) {
          morbidityMap[pCode] = {
            code: pCode,
            description: desc,
            count: 0,
            dpjp: p.dpjp,
            totalGain: 0
          };
        }
        morbidityMap[pCode].count += 1;
        morbidityMap[pCode].totalGain += gain;
      }
    }
  });

  const getPoliFromDPJP = (dpjp: string) => {
    if (dpjp.includes('Sp.PD')) return 'Poli Dalam';
    if (dpjp.includes('Sp.OG')) return 'Poli Kandungan';
    if (dpjp.includes('Sp.A')) return 'Poli Anak';
    if (dpjp.includes('Sp.N')) return 'Poli Saraf';
    if (dpjp.includes('Sp.B')) return 'Poli Bedah';
    if (dpjp.includes('Sp.P')) return 'Poli Paru';
    return 'Poli Umum';
  };

  const top10Diagnoses = Object.values(morbidityMap)
    .sort((a, b) => b.totalGain - a.totalGain)
    .slice(0, 10);

  return (
    <>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display text-[32px] font-bold text-on-surface">Management Summary Dashboard</h1>
          <p className="font-body-lg text-on-surface-variant">Fokus Optimasi Pendapatan & Akurasi Koding</p>
        </div>
      </div>

      {/* Task 1: Impact & Accuracy Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Optimasi Nilai Klaim</span>
            <span className="material-symbols-outlined text-emerald-600">trending_up</span>
          </div>
          <div className="font-headline-md text-[24px] font-bold text-emerald-700 leading-tight">
            +{formatIDR(optimasiNilaiKlaim)}
          </div>
          <div className="text-xs text-emerald-600/80 mt-2 font-medium">Nilai terselamatkan (Kasus Selesai)</div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Akurasi AI</span>
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
          <div className="font-display text-[40px] font-bold text-on-surface leading-none">
            94.5<span className="text-[24px]">%</span>
          </div>
          <div className="text-xs text-on-surface-variant mt-2 font-medium">Rata-rata persetujuan koding</div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Potensi Temuan (Unverified)</span>
            <span className="material-symbols-outlined text-amber-500">lightbulb</span>
          </div>
          <div className="font-headline-md text-[24px] font-bold text-amber-600 leading-tight">
            {formatIDR(potensiTemuan)}
          </div>
          <div className="text-xs text-amber-600/80 mt-2 font-medium">Dalam antrean Draft AI</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-error/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Antrean Review</span>
            <span className="material-symbols-outlined text-error">pending_actions</span>
          </div>
          <div className="font-display text-[40px] font-bold text-error leading-none">{antreanReview}</div>
          <div className="text-xs text-error/80 mt-2 font-medium">Pasien menunggu divalidasi</div>
        </div>
      </div>

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
        <div className="col-span-1 lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
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
                  <th className="py-3 px-2">Poli & DPJP Utama</th>
                  <th className="py-3 px-2 text-right">Impact Ekonomi</th>
                </tr>
              </thead>
              <tbody>
                {top10Diagnoses.length > 0 ? (
                  top10Diagnoses.map((data, idx) => {
                    const poli = getPoliFromDPJP(data.dpjp);
                    return (
                      <tr key={idx} className="border-b border-outline-variant/30 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 font-mono-data text-sm font-semibold text-slate-700">
                          <span className="bg-slate-200/60 px-2 py-1 rounded">{data.code}</span>
                        </td>
                        <td className="py-3 px-2 font-body-md text-on-surface max-w-[200px] truncate" title={data.description}>
                          {data.description}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-700">
                          {data.count}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-body-sm font-medium text-on-surface">{poli}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[150px]" title={data.dpjp}>{data.dpjp}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-title-md text-emerald-600">
                          +{formatIDR(data.totalGain)}
                        </td>
                      </tr>
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
    </>
  );
}

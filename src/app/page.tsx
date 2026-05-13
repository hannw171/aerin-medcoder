import { getPatients } from '@/lib/mockDb';
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from '@/utils/pricing';

export default function DashboardPage() {
  const patients = getPatients();
  
  const totalPasien = patients.length;
  const belumDikoding = patients.filter(p => p.status === 'Belum Coding').length;
  
  let totalKlaimVerified = 0;
  let totalOptimizationPotential = 0;
  
  let totalKlaimAll = 0;
  let totalBiayaRiilAll = 0;
  
  const optimizationByDiagnosis: Record<string, { count: number, totalGain: number }> = {};
  
  patients.forEach(p => {
    if (p.codingResult && p.codingResult.primaryDiagnosis) {
      const pCode = p.codingResult.primaryDiagnosis.code;
      const severity = determineSeverityLevel(p.codingResult.secondaryDiagnoses, p.codingResult.potentialFindings);
      const currentTariff = getEstimatedTariff(pCode, severity, p.codingResult.procedures);
      const baselineTariff = getEstimatedTariff(pCode, 1, p.codingResult.procedures);
      
      const biayaRiil = baselineTariff > 0 ? baselineTariff * 0.8 : 0;
      
      if (p.status === 'Selesai') {
        totalKlaimVerified += currentTariff;
      }
      
      if (p.status === 'Selesai' || p.status === 'Draft AI') {
        totalKlaimAll += currentTariff;
        totalBiayaRiilAll += biayaRiil;
        
        const gain = currentTariff - baselineTariff;
        if (gain > 0) {
          const diagDesc = p.codingResult.primaryDiagnosis.description;
          if (!optimizationByDiagnosis[diagDesc]) {
            optimizationByDiagnosis[diagDesc] = { count: 0, totalGain: 0 };
          }
          optimizationByDiagnosis[diagDesc].count += 1;
          optimizationByDiagnosis[diagDesc].totalGain += gain;
        }
      }
      
      if (p.status === 'Draft AI' && p.codingResult.potentialFindings && p.codingResult.potentialFindings.length > 0) {
        const severityWithoutPotential = determineSeverityLevel(p.codingResult.secondaryDiagnoses, []);
        const tariffWithoutPotential = getEstimatedTariff(pCode, severityWithoutPotential, p.codingResult.procedures);
        const diff = currentTariff - tariffWithoutPotential;
        if (diff > 0) {
          totalOptimizationPotential += diff;
        }
      }
    }
  });

  const totalMargin = totalKlaimAll - totalBiayaRiilAll;
  
  const topOptimizations = Object.entries(optimizationByDiagnosis)
    .sort((a, b) => b[1].totalGain - a[1].totalGain)
    .slice(0, 5);

  return (
    <>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display text-[32px] font-bold text-on-surface">Management Summary Dashboard</h1>
          <p className="font-body-lg text-on-surface-variant">RS Kelas C - Regional 1</p>
        </div>
      </div>

      {/* Task 1: Strategic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Total Pasien Pulang</span>
            <span className="material-symbols-outlined text-outline">group</span>
          </div>
          <div className="font-display text-[40px] font-bold text-on-surface leading-none">{totalPasien}</div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Belum Dikoding</span>
            <span className="material-symbols-outlined text-outline">pending_actions</span>
          </div>
          <div className="font-display text-[40px] font-bold text-error leading-none">{belumDikoding}</div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Klaim Terverifikasi</span>
            <span className="material-symbols-outlined text-emerald-600">verified</span>
          </div>
          <div className="font-headline-md text-[24px] font-bold text-emerald-700 leading-tight">
            {formatIDR(totalKlaimVerified)}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Potensi Optimasi (Unverified)</span>
            <span className="material-symbols-outlined text-amber-500">lightbulb</span>
          </div>
          <div className="font-headline-md text-[24px] font-bold text-amber-600 leading-tight">
            {formatIDR(totalOptimizationPotential)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task 2: Financial Efficiency View */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-outline-variant pb-2">Analisis Efisiensi Biaya</h2>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="flex justify-between items-center bg-surface-container p-4 rounded-lg">
              <span className="font-body-lg text-on-surface-variant">Total Klaim INA-CBG (Est)</span>
              <span className="font-headline-sm font-bold text-on-surface">{formatIDR(totalKlaimAll)}</span>
            </div>
            
            <div className="flex justify-between items-center bg-surface-container p-4 rounded-lg">
              <span className="font-body-lg text-on-surface-variant">Total Biaya Riil RS (Est)</span>
              <span className="font-headline-sm font-bold text-on-surface-variant">{formatIDR(totalBiayaRiilAll)}</span>
            </div>

            <div className={`flex justify-between items-center p-6 rounded-xl border ${totalMargin >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className={`font-title-lg ${totalMargin >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Total Margin / Surplus</span>
              <span className={`font-display text-[32px] font-bold ${totalMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalMargin >= 0 ? '+' : ''}{formatIDR(totalMargin)}
              </span>
            </div>
          </div>
        </div>

        {/* Task 3: Top Optimization Cases */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">Top Optimization Cases</h2>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">target</span>
              AI Accuracy: 94.5%
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {topOptimizations.length > 0 ? (
              topOptimizations.map(([desc, data], idx) => (
                <div key={idx} className="flex gap-4 items-center bg-surface p-4 rounded-lg border border-outline-variant/50 hover:border-primary/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-title-sm text-on-surface truncate">{desc}</div>
                    <div className="font-label-sm text-on-surface-variant mt-0.5">Identified {data.count} times</div>
                  </div>
                  <div className="font-title-md text-emerald-600 shrink-0">
                    +{formatIDR(data.totalGain)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-on-surface-variant italic">
                Belum ada data optimasi klaim.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

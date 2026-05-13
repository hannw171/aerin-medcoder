export type CodeItem = { id: string; code: string; description: string; insight?: string };

export const INA_CBG_RATES: Record<string, number[]> = {
  NEUROLOGI: [4200000, 5100000, 9800000],
  INFEKSI: [3800000, 4900000, 11500000],
  BEDAH_PROSEDUR: [8500000, 11200000, 18500000],
  PENYAKIT_DALAM: [3500000, 4800000, 8200000],
  KARDIOVASKULAR: [4500000, 5800000, 9200000],
  OBSTETRI: [4000000, 5200000, 8500000]
};

export function getCategoryFromCode(primaryCode: string, procedures: CodeItem[]): string {
  if (!primaryCode) return 'PENYAKIT_DALAM';
  
  const procDesc = procedures.map(p => p.description.toLowerCase()).join(' ');
  const surgeryKeywords = ['appendectomy', 'sectio', 'ligasi', 'kuretase', 'manual plasenta'];
  
  if (surgeryKeywords.some(keyword => procDesc.includes(keyword))) {
    return 'BEDAH_PROSEDUR';
  }

  const prefix = primaryCode.toUpperCase();
  
  if (prefix.startsWith('I6')) return 'NEUROLOGI';
  if (/^[AJBLH]/.test(prefix)) return 'INFEKSI';
  if (prefix.startsWith('O')) return 'OBSTETRI';
  if (prefix.startsWith('I1') || prefix.startsWith('I5')) return 'KARDIOVASKULAR';
  if (/^[EKN]/.test(prefix)) return 'PENYAKIT_DALAM';
  
  return 'PENYAKIT_DALAM';
}

export function determineSeverityLevel(
  secondaryDiagnoses: CodeItem[],
  potentialFindings: { description: string; insight: string }[] = []
): 1 | 2 | 3 {
  if (secondaryDiagnoses.length === 0 && potentialFindings.length === 0) {
    return 1;
  }

  const criticalKeywords = ['sepsis', 'aki', 'shock', 'syok', 'kidney injury', 'failure', 'koma', 'hellp', 'hemorrhage', 'perdarahan', 'renal failure'];
  
  const allDescriptions = [
    ...secondaryDiagnoses.map(d => d.description.toLowerCase()),
    ...potentialFindings.map(f => f.description.toLowerCase())
  ];

  const hasCritical = allDescriptions.some(desc => 
    criticalKeywords.some(keyword => desc.includes(keyword))
  );

  if (hasCritical) {
    return 3;
  }
  
  return 2;
}

export function getEstimatedTariff(primaryCode: string, severityLevel: 1 | 2 | 3, procedures: CodeItem[]): number {
  if (!primaryCode) return 0;
  const category = getCategoryFromCode(primaryCode, procedures);
  const rates = INA_CBG_RATES[category] || INA_CBG_RATES['PENYAKIT_DALAM'];
  
  return rates[severityLevel - 1];
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(amount);
}

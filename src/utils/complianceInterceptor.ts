import { isFKTPCompetence, FKTP_COMPETENCE_CODES } from '@/data/fktpCompetence';
import { useRegulationStore } from '@/store/useRegulationStore';

/**
 * The "Two-Gate Keeper" architecture engine.
 * This intercepts the raw clinical text and demographics, applying both
 * Gate 1 (National/Static constraints like FKTP) and Gate 2 (Local Custom Rules).
 */
export function enrichPromptWithCompliance(
  patientText: string,
  currentAge: number,
  currentGender: 'L' | 'P',
  serviceType: 'RANAP' | 'RAJAN'
): string {
  const rules = useRegulationStore.getState().rules;
  const promptAdditions: string[] = [];
  const textLower = patientText.toLowerCase();

  // ---------------------------------------------------------
  // GATE 1: STATIC NATIONAL RULES (FKTP & PRB)
  // ---------------------------------------------------------
  const prbKeywords = ['stabil', 'rutin', 'kontrol'];
  const emergencyKeywords = ['akut', 'syok', 'gawat', 'darurat', 'perdarahan', 'koma', 'sesak'];
  
  const hasPRBTerm = prbKeywords.some(kw => textLower.includes(kw));
  const hasEmergencyTerm = emergencyKeywords.some(kw => textLower.includes(kw));

  if (hasPRBTerm && !hasEmergencyTerm) {
    promptAdditions.push(
      "⚠️ POTENSI KEBOCORAN PRB: Teks klinis mengandung indikasi pasien stabil/rutin tanpa parameter gawat darurat yang jelas. " +
      "Instruksi: Analisis log klinis dengan ketat untuk mencari bukti komplikasi. Jika ini adalah penyakit kompetensi dasar FKTP tanpa penyulit, " +
      "berikan peringatan bahwa kasus ini berpotensi sebagai Program Rujuk Balik (PRB) dan tidak layak rawat lanjut/klaim penuh."
    );
  }

  // ---------------------------------------------------------
  // GATE 2: LOCAL CUSTOM REGULATIONS (Zustand Store)
  // ---------------------------------------------------------
  rules.forEach(rule => {
    // Check if the rule is applicable for the current service type
    const isGlobal = rule.targetCode === "GLOBAL";
    const isGlobalRanap = serviceType === "RANAP" && rule.targetCode === "GLOBAL_RANAP";
    const isGlobalRajan = serviceType === "RAJAN" && rule.targetCode === "GLOBAL_RAJAN";
    const isSpecificCode = !["GLOBAL", "GLOBAL_RANAP", "GLOBAL_RAJAN"].includes(rule.targetCode);

    // If it's a global rule for the wrong service type, skip it entirely
    if (!isGlobal && !isGlobalRanap && !isGlobalRajan && !isSpecificCode) {
      return;
    }

    let triggered = false;

    switch (rule.ruleType) {
      case "Batasan Usia":
        if (rule.condition && typeof rule.condition.minAge === 'number' && typeof rule.condition.maxAge === 'number') {
          // Trigger if the rule targets a specific age range and the patient falls OUTSIDE of it, 
          // or if the rule acts as a warning when they DO fall inside.
          if (currentAge < rule.condition.minAge || currentAge > rule.condition.maxAge) {
            triggered = true;
          }
        }
        break;

      case "Restriksi Gender":
        if (rule.condition && rule.condition.requiredGender) {
          const reqGenderLetter = rule.condition.requiredGender.charAt(0).toUpperCase();
          // Trigger if gender restricts it and patient doesn't match
          if (currentGender !== reqGenderLetter) {
            triggered = true;
          }
        }
        break;

      case "Screening PRB":
        if (rule.condition && rule.condition.mandatoryClinicalKeywords) {
          const kws = rule.condition.mandatoryClinicalKeywords.split(',').map(k => k.trim().toLowerCase());
          // Trigger if any of the keywords are present
          if (kws.some(kw => textLower.includes(kw))) {
            triggered = true;
          }
        }
        break;

      case "Tips FAQ Casemix":
        // Tips are generally applied if the target code is detected by the AI.
        triggered = true;
        break;
    }

    if (triggered) {
      if (isSpecificCode) {
        promptAdditions.push(`- JIKA KODE DIAGNOSIS DIAWALI DENGAN [${rule.targetCode}] (${rule.ruleType}): ${rule.recommendation}`);
      } else {
        promptAdditions.push(`- ATURAN UMUM (${rule.ruleType}): ${rule.recommendation}`);
      }
    }
  });

  if (promptAdditions.length === 0) {
    return "";
  }

  return `
[SISTEM GUARDRAIL KEPATUHAN BPJS & CASEMIX]
Evaluasi narasi klinis dan pastikan hasil koding Anda mematuhi aturan berikut:
${promptAdditions.join('\n')}
`.trim();
}

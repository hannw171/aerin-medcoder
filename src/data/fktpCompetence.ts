export const FKTP_COMPETENCE_CODES = [
  // 144 Basic Competence Diseases (Sample of prominent ones based on PMK)
  "A01", "A09", "B01", "B05", "B15", "B26", "E11", "E46", "F41", "G43",
  "H10", "H65", "I10", "J00", "J01", "J02", "J03", "J06", "J20", "J45",
  "K02", "K04", "K21", "K29", "K30", "L01", "L02", "L20", "L50", "M79",
  "N39", "O00", "O80", "R04", "R07", "R10", "R50"
];

/**
 * Checks if a given ICD-10 code falls under FKTP (Fasilitas Kesehatan Tingkat Pertama) competence.
 * This is used as Gate 1 to prevent upcoding of primary care cases in secondary/tertiary care without complication proofs.
 */
export function isFKTPCompetence(code: string): boolean {
  if (!code) return false;
  const normalizedCode = code.toUpperCase().trim();
  return FKTP_COMPETENCE_CODES.some(fktpCode => normalizedCode.startsWith(fktpCode));
}

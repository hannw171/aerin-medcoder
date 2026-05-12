import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Memory cache for the dictionary to avoid reading the file on every request
let icd10Cache: Map<string, { description: string, category: string, chapter: string }> | null = null;

function loadIcd10Dictionary() {
  if (icd10Cache) return;

  try {
    const filePath = path.join(process.cwd(), 'data', 'icd102019syst_codes.txt');
    if (!fs.existsSync(filePath)) {
      console.warn("ICD-10 dictionary file not found at:", filePath);
      icd10Cache = new Map();
      return;
    }

    icd10Cache = new Map();
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const parts = line.split(';');
      if (parts.length >= 9) {
        const chapter = parts[3];
        const category = parts[4];
        const code = parts[5].replace(/\./g, '').toLowerCase();
        const desc = parts[8].trim();
        icd10Cache!.set(code, { description: desc, category, chapter });
      }
    });
    console.log("ICD-10 Dictionary loaded for lookup API.");
  } catch (error) {
    console.error("Failed to load ICD-10 dictionary:", error);
    icd10Cache = new Map();
  }
}

function getDiagnosisType(code: string) {
  const c = code.charAt(0).toUpperCase();
  const num = parseInt(code.substring(1, 3), 10);
  
  if (c === 'A' || c === 'B') return 'Infectious';
  if (c === 'C' || (c === 'D' && num <= 48)) return 'Neoplasms';
  if (c === 'D' && num >= 50) return 'Blood';
  if (c === 'E') return 'Endocrine';
  if (c === 'F') return 'Psychiatry';
  if (c === 'G') return 'Neurology';
  if (c === 'H' && num <= 59) return 'Eye';
  if (c === 'H' && num >= 60) return 'Ear';
  if (c === 'I') return 'Circulatory';
  if (c === 'J') return 'Respiratory';
  if (c === 'K') return 'Digestive';
  if (c === 'L') return 'Dermatology';
  if (c === 'M') return 'Musculoskeletal';
  if (c === 'N') return 'Genitourinary';
  if (c === 'O') return 'Obstetrics';
  if (c === 'P') return 'Perinatal';
  if (c === 'Q') return 'Congenital';
  if (c === 'R') return 'Symptoms';
  if (c === 'S' || c === 'T') return 'Injury';
  if (c === 'V' || c === 'W' || c === 'X' || c === 'Y') return 'External Causes';
  if (c === 'Z') return 'Factors';
  if (c === 'U') return 'Special';
  return 'Other';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
  }

  loadIcd10Dictionary();

  // Normalize code: remove dots and make lowercase to match cache keys
  const normalizedCode = code.replace(/\./g, '').toLowerCase();

  const data = icd10Cache!.get(normalizedCode);

  if (data) {
    const diagnosisType = getDiagnosisType(code);
    return NextResponse.json({ 
      code: code.toUpperCase(), 
      description: data.description,
      category: data.category,
      chapter: data.chapter,
      type: diagnosisType
    });
  } else {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
}

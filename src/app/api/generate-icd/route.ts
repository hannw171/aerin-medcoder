import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// 1. GLOBAL CACHE VARIABLES (In-Memory)
// Variabel ini ada di luar fungsi POST agar datanya tetap hidup di RAM server
let icd10Cache: Map<string, string> | null = null;
let icd9Cache: Map<string, string> | null = null;

// Local Policies Cache
let localPoliciesCache: any[] = [];
let localPoliciesLastModified: number = 0;
let cachedFormattedPolicies: string = "";

function getActivePoliciesFormatted() {
  try {
    const policiesPath = path.join(process.cwd(), 'data', 'localPolicies.json');
    if (!fs.existsSync(policiesPath)) {
      cachedFormattedPolicies = "";
      return "";
    }

    const stats = fs.statSync(policiesPath);
    // Jika file berubah, kita re-read dan re-format
    if (stats.mtimeMs > localPoliciesLastModified) {
      console.log("Local policies changed on disk, updating cache...");
      const content = fs.readFileSync(policiesPath, 'utf-8');
      const policies = JSON.parse(content);
      const activePolicies = policies.filter((p: any) => p.isActive);
      
      if (activePolicies.length === 0) {
        cachedFormattedPolicies = "";
      } else {
        let formatted = "LOCAL HOSPITAL POLICIES (MANDATORY OVERRIDE):\n";
        formatted += "You MUST prioritize these local hospital rules over any general medical knowledge or standard WHO guidelines.\n";
        activePolicies.forEach((p: any) => {
          formatted += `- IF keywords contain [${p.keywords.join(", ")}] THEN use ICD-10 Code: ${p.icdCode}\n`;
        });
        cachedFormattedPolicies = formatted + "\n";
      }
      
      localPoliciesLastModified = stats.mtimeMs;
    }

    return cachedFormattedPolicies;
  } catch (error) {
    console.error("Failed to load local policies:", error);
    return "";
  }
}

// 2. INITIALIZATION FUNCTION
// Fungsi ini hanya akan membaca file 1 kali saja saat server pertama kali memanggil route ini
function initializeDictionaries() {
  if (icd10Cache && icd9Cache) return; // Jika sudah di-load, lewati

  console.log("Loading ICD dictionaries into memory...");
  icd10Cache = new Map<string, string>();
  icd9Cache = new Map<string, string>();

  try {
    const icd10Path = path.join(process.cwd(), 'data', 'icd102019syst_codes.txt');
    const icd9Path = path.join(process.cwd(), 'data', 'CMS28_DESC_LONG_SG.txt');

    // Load ICD-10
    const icd10Content = fs.readFileSync(icd10Path, 'utf-8');
    icd10Content.split('\n').forEach(line => {
      const parts = line.split(';');
      if (parts.length >= 9) {
        const code = parts[5].replace(/\./g, '').toLowerCase();
        const desc = parts[8].trim();
        icd10Cache!.set(code, desc);
      }
    });

    // Load ICD-9
    const icd9Content = fs.readFileSync(icd9Path, 'utf-8');
    icd9Content.split('\n').forEach(line => {
      const firstSpaceIndex = line.indexOf(' ');
      if (firstSpaceIndex > 0) {
        let code = line.substring(0, firstSpaceIndex).replace(/\./g, '').toLowerCase();
        const desc = line.substring(firstSpaceIndex + 1).trim();
        icd9Cache!.set(code, desc);
      }
    });

    console.log("Dictionaries successfully cached!");
  } catch (err) {
    console.error("Failed to load dictionaries into memory:", err);
  }
}

// Initialize Gemini SDK with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  // Panggil fungsi inisialisasi. Dia akan membaca file jika cache masih kosong.
  initializeDictionaries();

  try {
    const body = await request.json();
    const { medicalRecord } = body;

    if (!medicalRecord) {
      return NextResponse.json({ error: 'medicalRecord data is required' }, { status: 400 });
    }

    const localPoliciesText = getActivePoliciesFormatted();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
You are an expert Clinical Coder operating in an Indonesian hospital setting for BPJS Kesehatan / INA-CBG casemix claims.

CRITICAL INSTRUCTIONS & VERSIONING:
1. DIAGNOSES: You MUST use the WHO ICD-10 (2019 Version) standard.
2. PROCEDURES: You MUST use the ICD-9-CM (Clinical Modification, Volume 3, CMS 28) standard.
3. PROHIBITION: DO NOT use CPT (Current Procedural Terminology) or ICD-10-PCS codes.

FEW-SHOT CALIBRATION:
- CT Scan Kepala / Otak / Cranium -> 87.03
- EKG / Elektrokardiogram -> 89.52
- Echocardiograph / Echocardiography -> 88.73
- Rontgen Thorax / Dada -> 87.49
- USG Abdomen -> 88.76
- Pemasangan Infus / Injeksi IV -> 99.18
- Pemasangan Kateter Urin (Foley Catheter) -> 57.94

${localPoliciesText}

Analyze the following patient medical record data and extract the appropriate codes.

PATIENT MEDICAL RECORD:
Anamnesa: ${medicalRecord.anamnesa || 'N/A'}
TTV: ${JSON.stringify(medicalRecord.ttv || {})}
Physical Exam: ${medicalRecord.physicalExam || 'N/A'}
Lab Results: ${medicalRecord.labResult || 'N/A'}
Radiology Results: ${medicalRecord.radiologyResult || 'N/A'}
Procedures: ${JSON.stringify(medicalRecord.procedures || [])}
Inpatient Meds: ${JSON.stringify(medicalRecord.inpatientMeds || [])}
Discharge Meds: ${JSON.stringify(medicalRecord.dischargeMeds || [])}
Clinical Primary Diagnosis: ${medicalRecord.diagnosisKlinisUtama || 'N/A'}
Clinical Secondary Diagnosis: ${medicalRecord.diagnosisKlinisSekunder || 'N/A'}

TASKS:
1. Determine the Primary Diagnosis (Diagnosa Utama).
2. Determine all relevant Secondary Diagnoses (Diagnosa Sekunder).
3. Determine all relevant Procedures (Tindakan).
4. Output ONLY a JSON object that strictly matches this exact structure:

{
  "primaryDiagnosis": { "code": "...", "description": "..." },
  "secondaryDiagnoses": [ { "code": "...", "description": "..." } ],
  "procedures": [ { "code": "...", "description": "..." } ]
}
`;

    // 1. Eksekusi API Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON response from AI' }, { status: 500 });
    }

    // 2. Post-processing Grounding Logic (Sekarang MENGGUNAKAN CACHE MEMORI)
    const groundCode = (item: any, mapCache: Map<string, string> | null) => {
      if (!item || !item.code || !mapCache) return;
      const normalizedCode = item.code.replace(/\./g, '').toLowerCase();
      if (mapCache.has(normalizedCode)) {
        item.description = mapCache.get(normalizedCode);
      } else {
        item.description = item.description + ' (Unverified)';
      }
    };
    
    if (parsedResponse.primaryDiagnosis) {
      groundCode(parsedResponse.primaryDiagnosis, icd10Cache);
    }
    if (Array.isArray(parsedResponse.secondaryDiagnoses)) {
      parsedResponse.secondaryDiagnoses.forEach((diag: any) => groundCode(diag, icd10Cache));
    }
    if (Array.isArray(parsedResponse.procedures)) {
      parsedResponse.procedures.forEach((proc: any) => groundCode(proc, icd9Cache));
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error generating ICD codes:', error);
    return NextResponse.json({ error: 'Failed to generate ICD codes' }, { status: 500 });
  }
}
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
    const { medicalRecord, complianceGuardrail } = body;

    if (!medicalRecord) {
      return NextResponse.json({ error: 'medicalRecord data is required' }, { status: 400 });
    }

    const localPoliciesText = getActivePoliciesFormatted();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      },
    });

    const prompt = `
ROLE: INA-CBG Clinical Coder, Indonesian BPJS Kesehatan hospital setting.

RULES:
1. Diagnoses → ICD-10 (WHO 2019). Procedures → ICD-9-CM Vol.3 CMS28. NO CPT or ICD-10-PCS.
2. Code ONLY diagnoses explicitly stated by physician in Primary/Secondary Diagnosis fields.
3. Prefer 3-5 digit ICD-10 codes for E-Klaim compatibility (e.g., J18.9 or M47.26, not J18.900 or M47.261).
4. Perform compliance audits on the generated codes based on patient demographics, service type, and casemix guidelines.

PROCEDURE REFERENCE (ICD-9-CM):
CT Scan kepala→87.03 | EKG→89.52 | Echo→88.73 | Rontgen thorax→87.49 | USG abdomen→88.76 | Infus IV→99.18 | Kateter Foley→57.94

${localPoliciesText}

${complianceGuardrail || ''}

PATIENT RECORD:
Primary Dx: ${medicalRecord.diagnosisKlinisUtama || 'N/A'}
Secondary Dx: ${medicalRecord.diagnosisKlinisSekunder || 'N/A'}
Anamnesa: ${medicalRecord.anamnesa || 'N/A'}
TTV: ${JSON.stringify(medicalRecord.ttv || {})}
Physical Exam: ${medicalRecord.physicalExam || 'N/A'}
Lab: ${medicalRecord.labResult || 'N/A'}
Radiology: ${medicalRecord.radiologyResult || 'N/A'}
Procedures: ${JSON.stringify(medicalRecord.procedures || [])}
Meds (Inpatient): ${JSON.stringify(medicalRecord.inpatientMeds || [])}
Meds (Discharge): ${JSON.stringify(medicalRecord.dischargeMeds || [])}

OUTPUT: Respond ONLY with a single valid JSON object of this exact structure:
{
  "icd10": ["CODE1", "CODE2", ...],
  "icd9": ["CODE1", "CODE2", ...],
  "complianceAlerts": [
    {
      "type": "Screening PRB" | "Batasan Usia" | "Restriksi Gender" | "Tips FAQ Casemix",
      "targetCode": "CODE STRING (e.g., Z09.8, E11, P03)",
      "isViolated": boolean,
      "message": "Warning message detail",
      "clarificationText": "Polite text for DPJP clarification (e.g., Mohon konfirmasi DPJP...)"
    }
  ]
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

    // Grounding & Mapping to keep frontend backward compatibility
    const icd10Codes = Array.isArray(parsedResponse.icd10) ? parsedResponse.icd10 : [];
    const icd9Codes = Array.isArray(parsedResponse.icd9) ? parsedResponse.icd9 : [];

    const primaryCode = icd10Codes[0] || null;
    const secondaryCodes = icd10Codes.slice(1);

    const getGroundedItem = (code: string | null, mapCache: Map<string, string> | null) => {
      if (!code) return null;
      const normalizedCode = code.replace(/\./g, '').toLowerCase();
      let description = "Unverified description";
      if (mapCache && mapCache.has(normalizedCode)) {
        description = mapCache.get(normalizedCode) || "";
      }
      return { code, description };
    };

    const primaryDiagnosis = primaryCode ? getGroundedItem(primaryCode, icd10Cache) : null;
    const secondaryDiagnoses = secondaryCodes.map((code: string) => getGroundedItem(code, icd10Cache)).filter(Boolean);
    const procedures = icd9Codes.map((code: string) => getGroundedItem(code, icd9Cache)).filter(Boolean);

    const responseData = {
      ...parsedResponse,
      primaryDiagnosis,
      secondaryDiagnoses,
      procedures,
      potentialFindings: []
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error generating ICD codes:', error);
    return NextResponse.json({ error: 'Failed to generate ICD codes' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Memory cache for the dictionary to avoid reading the file on every request
let icd10Cache: Map<string, string> | null = null;

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
        const code = parts[5].replace(/\./g, '').toLowerCase();
        const desc = parts[8].trim();
        icd10Cache!.set(code, desc);
      }
    });
    console.log("ICD-10 Dictionary loaded for lookup API.");
  } catch (error) {
    console.error("Failed to load ICD-10 dictionary:", error);
    icd10Cache = new Map();
  }
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

  const description = icd10Cache!.get(normalizedCode);

  if (description) {
    return NextResponse.json({ code: code.toUpperCase(), description });
  } else {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const qLowerCase = query.toLowerCase();
  let filePath = '';
  let parseLine: (line: string) => { code: string; description: string } | null;

  if (type === 'icd10') {
    filePath = path.join(process.cwd(), 'data', 'icd102019syst_codes.txt');
    parseLine = (line: string) => {
      const parts = line.split(';');
      if (parts.length >= 9) {
        // ICD-10 text typically contains code at index 5 and description at index 8
        const code = parts[5];
        const description = parts[8];
        return { code, description };
      }
      return null;
    };
  } else if (type === 'icd9') {
    filePath = path.join(process.cwd(), 'data', 'CMS28_DESC_LONG_SG.txt');
    parseLine = (line: string) => {
      const firstSpaceIndex = line.indexOf(' ');
      if (firstSpaceIndex > 0) {
        let code = line.substring(0, firstSpaceIndex);
        const description = line.substring(firstSpaceIndex + 1);
        
        // Format ICD-9 Procedure code: add dot after 2nd digit if length > 2
        if (code.length > 2 && !code.includes('.')) {
          code = code.substring(0, 2) + '.' + code.substring(2);
        }
        
        return { code, description };
      }
      return null;
    };
  } else {
    return NextResponse.json({ error: 'Invalid type parameter. Use icd10 or icd9.' }, { status: 400 });
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const results = [];

    const qNoDot = qLowerCase.replace(/\./g, '');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parsed = parseLine(line);
      if (parsed) {
        const codeNoDot = parsed.code.toLowerCase().replace(/\./g, '');
        if (codeNoDot.includes(qNoDot) || parsed.description.toLowerCase().includes(qLowerCase)) {
          results.push(parsed);
          if (results.length >= 15) {
            break;
          }
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error reading ICD file:', error);
    return NextResponse.json({ error: 'Failed to read ICD data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'localPolicies.json');

function getPolicies() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return [];
    }
    const content = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading policies:', error);
    return [];
  }
}

function savePolicies(policies: any[]) {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify(policies, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving policies:', error);
    return false;
  }
}

export async function GET() {
  const policies = getPolicies();
  return NextResponse.json(policies);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const policies = getPolicies();
    
    const newPolicy = {
      ...body,
      id: crypto.randomUUID(),
      isActive: body.isActive ?? true
    };
    
    policies.push(newPolicy);
    if (savePolicies(policies)) {
      return NextResponse.json(newPolicy, { status: 201 });
    }
    return NextResponse.json({ error: 'Failed to save policy' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

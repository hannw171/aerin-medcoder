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
    fs.writeFileSync(DATA_PATH, JSON.stringify(policies, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving policies:', error);
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const policies = getPolicies();
    
    const index = policies.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    
    policies[index] = { ...policies[index], ...body };
    
    if (savePolicies(policies)) {
      return NextResponse.json(policies[index]);
    }
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const policies = getPolicies();
    
    const filteredPolicies = policies.filter((p: any) => p.id !== id);
    
    if (filteredPolicies.length === policies.length) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    
    if (savePolicies(filteredPolicies)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

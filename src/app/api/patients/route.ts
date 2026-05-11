import { NextResponse } from 'next/server';
import { getPatients } from '@/lib/mockDb';

export async function GET() {
  const patients = getPatients();
  return NextResponse.json(patients);
}

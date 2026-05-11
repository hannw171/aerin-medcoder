import { NextResponse } from 'next/server';
import { updatePatient } from '@/lib/mockDb';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    console.log(`[API] PATCH /api/patients/${resolvedParams.id}`, body);
    const updatedPatient = updatePatient(resolvedParams.id, body);

    if (!updatedPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { initializeData } from '@/lib/init-data';

export async function GET() {
  try {
    await initializeData();
    return NextResponse.json({ success: true, message: 'Data initialized successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to initialize data: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

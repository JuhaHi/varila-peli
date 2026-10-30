import { NextResponse } from 'next/server';
import { inMemoryDb } from '@/lib/gameServer';

export async function POST() {
  inMemoryDb.resetAll();
  return NextResponse.json({ success: true, message: 'Peli alustettu oletustilaan.' });
}

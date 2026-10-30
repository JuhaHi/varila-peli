import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'NFC-tagit on poistettu käytöstä Tapaus Värilän uudessa arkkitehtuurissa (Protokolla 1888).',
    },
    { status: 410 }
  );
}

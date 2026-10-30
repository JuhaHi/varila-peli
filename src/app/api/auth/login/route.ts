import { NextResponse } from 'next/server';
import { handleAuthLogin } from '@/lib/gameServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, pinCode, pin_code } = body;
    const pin = pinCode || pin_code;

    if (!name || !pin) {
      return NextResponse.json(
        { success: false, error: 'Syötä sekä nimi että 4-numeroinen PIN-koodi.' },
        { status: 400 }
      );
    }

    const result = await handleAuthLogin(name, pin);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json(
      { success: false, error: 'Palvelinvirhe kirjautumisessa.' },
      { status: 500 }
    );
  }
}

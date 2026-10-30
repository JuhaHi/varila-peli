import { NextResponse } from 'next/server';
import { handleResetGame } from '@/lib/gameServer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = body.adminPin || body.admin_pin || req.headers.get('x-admin-pin') || '';
    const result = await handleResetGame(String(pin));
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json({ success: true, message: 'Peli alustettu oletustilaan.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Nollaus epäonnistui.' }, { status: 500 });
  }
}

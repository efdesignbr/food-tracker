import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const e = env();
    const key = process.env.ANTHROPIC_API_KEY || '';
    const maskedLen = key ? key.length : 0;
    return NextResponse.json({
      ok: true,
      anthropic: {
        key_present: !!key,
        key_length: maskedLen,
        model_default: e.ANTHROPIC_MODEL_DEFAULT,
        model_fallback: e.ANTHROPIC_MODEL_FALLBACK
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}


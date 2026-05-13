import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { phone } = await params;
  const flaskUrl = (process.env.FLASK_URL || '').replace(/\/+$/, '');

  if (!flaskUrl) {
    return NextResponse.json({ status: 'encerrado', phone });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${flaskUrl}/admin/fechar/${phone}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({ status: 'encerrado', phone }));
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error(`Stop [${phone}]:`, err.message);
    return NextResponse.json({ status: 'encerrado', phone }, { status: 200 });
  }
}

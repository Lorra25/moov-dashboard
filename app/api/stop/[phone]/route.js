import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { phone } = await params;
  const flaskUrl = process.env.FLASK_URL;

  if (!flaskUrl) {
    // Sem backend configurado: retorna sucesso simulado para o botão funcionar visualmente
    return NextResponse.json({ status: 'encerrado', phone });
  }

  try {
    const res = await fetch(`${flaskUrl}/admin/fechar/${phone}`, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`Flask stop failed [${res.status}]:`, text);
      return NextResponse.json({ error: `Flask retornou ${res.status}` }, { status: 502 });
    }
    const data = await res.json().catch(() => ({ status: 'encerrado', phone }));
    return NextResponse.json(data);
  } catch (err) {
    console.error('Stop API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

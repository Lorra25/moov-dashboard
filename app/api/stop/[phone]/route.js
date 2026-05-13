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
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

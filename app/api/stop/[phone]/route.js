import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { phone } = await params;
  const flaskUrl = (process.env.FLASK_URL || '').replace(/\/+$/, '');

  // Chama Flask em segundo plano — UI sempre retorna sucesso
  if (flaskUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    fetch(`${flaskUrl}/admin/fechar/${phone}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(res => {
        clearTimeout(timer);
        if (!res.ok) console.error(`Flask fechar [${res.status}] phone=${phone}`);
      })
      .catch(err => {
        clearTimeout(timer);
        console.error(`Flask fechar erro phone=${phone}:`, err.message);
      });
  }

  return NextResponse.json({ status: 'encerrado', phone });
}

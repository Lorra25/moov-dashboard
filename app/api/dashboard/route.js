import { NextResponse } from 'next/server';
import { google } from 'googleapis';

function normalizePhone(phone) {
  const p = String(phone).replace(/\D/g, '');
  if (p.length === 10) return '55' + p.slice(0, 2) + '9' + p.slice(2);
  if (p.length === 11) return '55' + p;
  if (p.length === 12) return p.slice(0, 4) + '9' + p.slice(4);
  return p;
}

function normalizeCanal(val) {
  const v = String(val).trim().toLowerCase();
  if (v === 'instagram') return 'instagram';
  if (v === 'site') return 'site';
  return 'whatsapp';
}

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export async function GET() {
  try {
    const credsRaw = process.env.GOOGLE_CREDENTIALS_JSON;
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!credsRaw || !spreadsheetId) {
      return NextResponse.json({ error: 'Variáveis de ambiente não configuradas' }, { status: 500 });
    }

    const credentials = JSON.parse(credsRaw);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Numero de Mensagens!A:G',
    });

    const rows = response.data.values ?? [];
    if (rows.length < 2) {
      return NextResponse.json({ contacts_today: 0, contacts_month: 0, materials_today: 0, recent: [], leads_por_dia: [] });
    }

    // Linha 0 = cabeçalho (ATLID, PHONE, NOME, THREAD ID, DATA E HORA, MATERIAL ENVIADO, CANAL)
    const dataRows = rows.slice(1);

    const now = nowBrasilia();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;
    const monthStr = `${mm}/${yyyy}`;

    let contacts_today = 0;
    let contacts_month = 0;
    let materials_today = 0;
    const recent = [];
    const leadsMap = {};

    for (const row of dataRows) {
      const dateStr = row[4] ?? '';
      const material = String(row[5] ?? '').trim().toLowerCase() === 'enviado' ? 'Enviado' : '';
      const canal = normalizeCanal(row[6] ?? '');

      if (dateStr.startsWith(todayStr)) {
        contacts_today++;
        if (material) materials_today++;
      }
      if (dateStr.includes(monthStr)) {
        contacts_month++;
        const dateKey = dateStr.slice(0, 5);
        if (!leadsMap[dateKey]) {
          leadsMap[dateKey] = { date: dateKey, total: 0, instagram: 0, site: 0, whatsapp: 0 };
        }
        leadsMap[dateKey].total++;
        leadsMap[dateKey][canal]++;
      }

      recent.push({
        nome: row[2] ?? '',
        phone: normalizePhone(row[1] ?? ''),
        data: dateStr,
        material,
        canal,
      });
    }

    recent.reverse();

    const leads_por_dia = Object.values(leadsMap).sort((a, b) => {
      const [da] = a.date.split('/').map(Number);
      const [db] = b.date.split('/').map(Number);
      return da - db;
    });

    return NextResponse.json({ contacts_today, contacts_month, materials_today, recent, leads_por_dia });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const REFRESH_MS = 30_000;

const CANAIS = [
  { key: 'todos',     label: 'Todos' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'site',      label: 'Site' },
];

const CHART_COLORS = {
  whatsapp:  '#13cacd',
  site:      '#0faaa8',
  instagram: '#11c561',
};

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d2035',
      border: '1px solid #1a3550',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <p style={{ color: '#7a9ab5', fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill, fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Metricas() {
  const [data, setData] = useState({ contacts_today: 0, contacts_month: 0, materials_today: 0, recent: [], leads_por_dia: [] });
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [canalFilter, setCanalFilter] = useState('todos');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const json = await res.json();
      setData(json);
      const now = nowBrasilia();
      setUpdatedAt(
        now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const leads = data.leads_por_dia ?? [];

  const totalMes       = leads.reduce((s, d) => s + d.total,     0);
  const totalInstagram = leads.reduce((s, d) => s + d.instagram, 0);
  const totalSite      = leads.reduce((s, d) => s + d.site,      0);

  const chartData = canalFilter === 'todos'
    ? leads
    : leads.map(d => ({ date: d.date, [canalFilter]: d[canalFilter] }));

  return (
    <>
      <header>
        <a className="logo" href="/">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">MOOV<span>.</span></span>
            <span className="logo-sub">Video</span>
          </div>
        </a>
        <div className="header-meta">
          {updatedAt && <span className="header-updated">Atualizado em {updatedAt}</span>}
          <a href="/" className="nav-link">&#128202; Dashboard</a>
          <button className="refresh-btn" onClick={fetchData}>&#8635; Atualizar</button>
        </div>
      </header>

      <main>
        <div className="page-title">
          <h1>Métricas</h1>
          <p>Visualize o volume de leads por dia e por canal de origem.</p>
        </div>

        {loading ? (
          <div className="loading">Carregando dados...</div>
        ) : (
          <>
            <div className="cards">
              <div className="card">
                <div className="card-icon teal">&#128197;</div>
                <div className="card-label">Total do Mês</div>
                <div className="card-value teal">{totalMes}</div>
                <div className="card-bar teal" />
              </div>
              <div className="card">
                <div className="card-icon teal">&#128247;</div>
                <div className="card-label">Instagram</div>
                <div className="card-value" style={{ color: '#11c561' }}>{totalInstagram}</div>
                <div className="card-bar" style={{ background: '#11c561', opacity: 0.5 }} />
              </div>
              <div className="card">
                <div className="card-icon teal">&#127760;</div>
                <div className="card-label">Site</div>
                <div className="card-value teal">{totalSite}</div>
                <div className="card-bar teal" />
              </div>
            </div>

            <div className="canal-filters">
              <span className="filter-label">Canal:</span>
              {CANAIS.map(c => (
                <button
                  key={c.key}
                  className={`canal-btn canal-btn-${c.key}${canalFilter === c.key ? ' active' : ''}`}
                  onClick={() => setCanalFilter(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <span className="section-dot" />
                Leads por Dia — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              {leads.length === 0 ? (
                <div className="loading">Sem dados para este período</div>
              ) : mounted ? (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3550" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#1a3550"
                        tick={{ fill: '#7a9ab5', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#1a3550"
                        tick={{ fill: '#7a9ab5', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: '#7a9ab5', paddingTop: 12 }}
                        formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                      />
                      {(canalFilter === 'todos' || canalFilter === 'site') && (
                        <Bar dataKey="site" name="site" stackId="a" fill={CHART_COLORS.site} radius={[0, 0, 0, 0]} />
                      )}
                      {(canalFilter === 'todos' || canalFilter === 'instagram') && (
                        <Bar dataKey="instagram" name="instagram" stackId="a" fill={CHART_COLORS.instagram} radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </>
  );
}

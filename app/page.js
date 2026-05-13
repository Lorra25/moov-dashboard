'use client';

import { useState, useEffect, useCallback } from 'react';

const REFRESH_MS = 30_000;

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function todayStr() {
  const d = nowBrasilia();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function monthStr() {
  const d = nowBrasilia();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function Dashboard() {
  const [data, setData] = useState({ contacts_today: 0, contacts_month: 0, materials_today: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [stoppedPhones, setStoppedPhones] = useState(new Set());
  const [stoppingPhones, setStoppingPhones] = useState(new Set());
  const [monthVisible, setMonthVisible] = useState(false);

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

  const handleStop = async (phone) => {
    if (stoppedPhones.has(phone) || stoppingPhones.has(phone)) return;
    setStoppingPhones(prev => new Set([...prev, phone]));
    try {
      const res = await fetch(`/api/stop/${phone}`);
      if (res.ok) {
        setStoppedPhones(prev => new Set([...prev, phone]));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStoppingPhones(prev => { const s = new Set(prev); s.delete(phone); return s; });
    }
  };

  const today = todayStr();
  const month = monthStr();

  const todayRows = data.recent.filter(r => String(r.data).startsWith(today));
  const monthRows = data.recent.filter(r => String(r.data).includes(month));

  function renderRows(rows) {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="empty-row">Nenhum contato encontrado</td>
        </tr>
      );
    }
    return rows.map((r, i) => {
      const isStopped = stoppedPhones.has(r.phone);
      const isStopping = stoppingPhones.has(r.phone);
      const hasMaterial = r.material === 'Enviado';
      return (
        <tr key={i}>
          <td>{r.nome || '—'}</td>
          <td>{r.phone}</td>
          <td>{r.data}</td>
          <td>
            {hasMaterial
              ? <span className="badge badge-sent">&#10003; Enviado</span>
              : <span className="badge badge-none">—</span>}
          </td>
          <td>
            {hasMaterial || isStopped ? (
              <button className="stop-btn stopped" disabled>&#10003; Parado</button>
            ) : (
              <button
                className="stop-btn"
                disabled={isStopping}
                onClick={() => handleStop(r.phone)}
              >
                {isStopping ? '...' : '⏸ Parar'}
              </button>
            )}
          </td>
        </tr>
      );
    });
  }

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
          <button className="refresh-btn" onClick={fetchData}>&#8635; Atualizar</button>
        </div>
      </header>

      <main>
        <div className="page-title">
          <h1>Painel de Leads</h1>
          <p>Acompanhe os contatos e materiais enviados pelo agente de WhatsApp.</p>
        </div>

        {loading ? (
          <div className="loading">Carregando dados...</div>
        ) : (
          <>
            <div className="cards">
              <div className="card">
                <div className="card-icon orange">&#128172;</div>
                <div className="card-label">Contatos de Hoje</div>
                <div className="card-value orange">{data.contacts_today}</div>
                <div className="card-bar orange" />
              </div>
              <div className="card">
                <div className="card-icon teal">&#128197;</div>
                <div className="card-label">Contatos do Mês</div>
                <div className="card-value teal">{data.contacts_month}</div>
                <div className="card-bar teal" />
              </div>
              <div className="card">
                <div className="card-icon green">&#128196;</div>
                <div className="card-label">Materiais Enviados Hoje</div>
                <div className="card-value green">{data.materials_today}</div>
                <div className="card-bar green" />
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2>
                  <span className="section-dot" />
                  Histórico de Hoje
                </h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Telefone</th>
                      <th>Data e Hora</th>
                      <th>Material</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>{renderRows(todayRows)}</tbody>
                </table>
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="section-header">
                <h2>
                  <span className="section-dot" style={{ background: 'var(--brand)' }} />
                  Histórico do Mês
                </h2>
                <button
                  className="toggle-btn"
                  onClick={() => setMonthVisible(v => !v)}
                >
                  {monthVisible ? '▲ Recolher' : '▼ Expandir'}
                </button>
              </div>
              {monthVisible && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Data e Hora</th>
                        <th>Material</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>{renderRows(monthRows)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

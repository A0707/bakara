import React, { useState } from 'react';
import { Badge, Modal, Inp, Btn } from '../components/UI';
import {
  CATS,
  CAT_C,
  MOIS,
  INIT_CHARGES,
  INIT_ALIM,
  INIT_BIENS,
  INIT_LOCS,
  OWNERS,
  MOIS12,
  MOIS_C,
  PAY_MODES,
  modeMeta,
  fmt,
  fmtK,
} from '../lib/data';

export default function Charges({ data, setData, save, ro }) {
  const [show, setShow] = useState(false),
    [fil, setFil] = useState(''),
    [q, setQ] = useState('');
  const [form, setF] = useState({ d: '', c: '', date: '', m: 0, n: '' }),
    [eid, setEid] = useState(null);
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtD = (d) => {
    if (!d) return '--';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  // Filter + sort by date desc (newest first), legacy entries fallback to id desc
  const filtered = data.filter(
    (x) => (!fil || x.c === fil) && (!q || x.d.toLowerCase().includes(q.toLowerCase())),
  );
  const list = [...filtered].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return b.id - a.id;
  });
  const tot = list.reduce((s, x) => s + x.m, 0);

  const doSave = () => {
    if (!form.d.trim() || form.m <= 0 || !form.c || !form.date) return;
    const u = eid
      ? data.map((x) => (x.id === eid ? { ...x, ...form } : x))
      : [...data, { ...form, id: Date.now() }];
    setData(u);
    save(u);
    setF({ d: '', c: '', date: '', m: 0, n: '' });
    setEid(null);
    setShow(false);
  };
  const doEdit = (x) => {
    setF({ d: x.d, c: x.c, date: x.date || '', m: x.m, n: x.n || '' });
    setEid(x.id);
    setShow(true);
  };
  const doDel = (id) => {
    if (!confirm('Supprimer cette charge ?')) return;
    const u = data.filter((x) => x.id !== id);
    setData(u);
    save(u);
  };
  const doAdd = () => {
    setEid(null);
    setF({ d: '', c: '', date: today(), m: 0, n: '' });
    setShow(true);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {!ro && (
          <Btn onClick={doAdd} c="#16a34a">
            + Charge
          </Btn>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher une charge"
          placeholder="Rechercher une charge…"
          style={{
            padding: '8px 12px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12,
            flex: 1,
            minWidth: 120,
            outline: 'none',
          }}
        />
        <select
          aria-label="Filtrer par catégorie"
          value={fil}
          onChange={(e) => setFil(e.target.value)}
          style={{
            padding: '8px 10px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 11,
            background: '#fff',
          }}
        >
          <option value="">Toutes</option>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {['#', 'Date', 'Designation', 'Categorie', 'Montant', ...(ro ? [] : [''])].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        color: '#fff',
                        fontWeight: 600,
                        textAlign: h === 'Montant' ? 'right' : 'left',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((x, i) => (
                <tr
                  key={x.id}
                  style={{
                    background: i % 2 ? '#f8fafc' : '#fff',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{i + 1}</td>
                  <td
                    className="mono"
                    style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}
                  >
                    {x.date ? fmtD(x.date) : x.p || '--'}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500, maxWidth: 240 }}>
                    {x.d}
                    {x.n ? (
                      <span style={{ color: '#94a3b8', fontSize: 9, marginLeft: 4 }}>({x.n})</span>
                    ) : null}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <Badge t={x.c} c={CAT_C[x.c] || '#64748b'} />
                  </td>
                  <td
                    className="mono"
                    style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}
                  >
                    {fmt(x.m)}
                  </td>
                  {!ro && (
                    <td style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => doEdit(x)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#3b82f6',
                          padding: 3,
                        }}
                        aria-label="Modifier"
                      >
                        &#9998;
                      </button>
                      <button
                        onClick={() => doDel(x.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#ef4444',
                          padding: 3,
                          marginLeft: 2,
                        }}
                        aria-label="Supprimer"
                      >
                        &#10005;
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1e293b' }}>
                <td
                  colSpan={4}
                  style={{ padding: '10px 12px', color: '#fff', fontWeight: 700, fontSize: 11 }}
                >
                  TOTAL ({list.length})
                </td>
                <td
                  className="mono"
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {fmt(tot)}
                </td>
                {!ro && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <Modal
        show={show}
        onClose={() => setShow(false)}
        title={eid ? 'Modifier la charge' : 'Nouvelle charge'}
      >
        <Inp
          l="Designation"
          v={form.d}
          onChange={(v) => setF({ ...form, d: v })}
          ph="Ex: Frais avocat..."
        />
        <Inp l="Categorie" v={form.c} onChange={(v) => setF({ ...form, c: v })} opts={CATS} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp
            l="Montant (MAD)"
            v={form.m}
            onChange={(v) => setF({ ...form, m: v })}
            type="number"
          />
          <Inp l="Date" v={form.date} onChange={(v) => setF({ ...form, date: v })} type="date" />
        </div>
        <Inp l="Notes" v={form.n} onChange={(v) => setF({ ...form, n: v })} ph="Optionnel" />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn onClick={() => setShow(false)} outline c="#64748b">
            Annuler
          </Btn>
          <Btn onClick={doSave} disabled={!form.d.trim() || form.m <= 0 || !form.c || !form.date}>
            {eid ? 'Modifier' : 'Ajouter'}
          </Btn>
        </div>
      </Modal>
      {!ro && (
        <button
          className="fab"
          onClick={doAdd}
          aria-label="Nouvelle charge"
          title="Nouvelle charge"
        >
          +
        </button>
      )}
    </div>
  );
}

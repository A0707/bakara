import React, { useState } from 'react';
import { Badge, Modal, Inp, Btn } from '../components/UI';
import { fmt } from '../lib/data';
export default function Alim({ data, setData, save, ro }) {
  const [show, setShow] = useState(false),
    [form, setF] = useState({ s: '', m: 0, t: '', p: '' }),
    [eid, setEid] = useState(null);
  const tot = data.reduce((s, x) => s + x.m, 0);
  const doSave = () => {
    if (!form.s.trim() || form.m <= 0) return;
    const u = eid
      ? data.map((x) => (x.id === eid ? { ...x, ...form } : x))
      : [...data, { ...form, id: Date.now() }];
    setData(u);
    save(u);
    setF({ s: '', m: 0, t: '', p: '' });
    setEid(null);
    setShow(false);
  };
  const doAdd = () => {
    setEid(null);
    setF({ s: '', m: 0, t: '', p: '' });
    setShow(true);
  };

  return (
    <div>
      {!ro && (
        <Btn onClick={doAdd} c="#16a34a">
          + Alimentation
        </Btn>
      )}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginTop: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {['#', 'Source', 'Type', 'Periode', 'Montant', ...(ro ? [] : [''])].map((h) => (
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
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((x, i) => (
                <tr
                  key={x.id}
                  style={{
                    background: i % 2 ? '#f8fafc' : '#fff',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{x.s}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <Badge t={x.t || '--'} c="#2563eb" />
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>{x.p}</td>
                  <td
                    className="mono"
                    style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#16a34a',
                    }}
                  >
                    {fmt(x.m)}
                  </td>
                  {!ro && (
                    <td style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => {
                          setF({ s: x.s, m: x.m, t: x.t || '', p: x.p });
                          setEid(x.id);
                          setShow(true);
                        }}
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
                        onClick={() => {
                          if (!confirm('Supprimer cette alimentation ?')) return;
                          const u = data.filter((y) => y.id !== x.id);
                          setData(u);
                          save(u);
                        }}
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
              <tr style={{ background: '#16a34a' }}>
                <td colSpan={4} style={{ padding: '10px 12px', color: '#fff', fontWeight: 700 }}>
                  TOTAL
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
        title={eid ? 'Modifier' : 'Nouvelle alimentation'}
      >
        <Inp
          l="Source"
          v={form.s}
          onChange={(v) => setF({ ...form, s: v })}
          ph="Ex: Cheque HOUMAN"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp
            l="Montant (MAD)"
            v={form.m}
            onChange={(v) => setF({ ...form, m: v })}
            type="number"
          />
          <Inp
            l="Type"
            v={form.t}
            onChange={(v) => setF({ ...form, t: v })}
            opts={['Echeance', 'Cheque', 'Virement', 'Espece', 'Autre']}
          />
        </div>
        <Inp l="Periode" v={form.p} onChange={(v) => setF({ ...form, p: v })} ph="2025" />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn onClick={() => setShow(false)} outline c="#64748b">
            Annuler
          </Btn>
          <Btn onClick={doSave} disabled={!form.s.trim() || form.m <= 0}>
            {eid ? 'Modifier' : 'Ajouter'}
          </Btn>
        </div>
      </Modal>
      {!ro && (
        <button
          className="fab"
          onClick={doAdd}
          aria-label="Nouvelle alimentation"
          title="Nouvelle alimentation"
        >
          +
        </button>
      )}
    </div>
  );
}

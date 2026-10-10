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
import { paidAmount } from '../lib/metrics';

export default function Loyers({ data, setData, save, ro, biens, setBiens, saveBiens }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [payModal, setPayModal] = useState(null); // {loc} en cours de validation
  const [payForm, setPayForm] = useState({ mode: 'espece', date: '', montant: 0 });
  const [edit, setEdit] = useState(false),
    [form, setF] = useState({ name: '', rent: 0, bienId: '' }),
    [eid, setEid] = useState(null);
  const [histLoc, setHistLoc] = useState(null); // locataire dont on voit l'historique

  const key = (y, m) => y + '-' + m;
  const isPaid = (c, y, m) => !!(c.pay && c.pay[key(y, m)]);
  const bienName = (id) => {
    const b = biens.find((x) => x.id === id);
    return b ? b.nom : null;
  };

  // années présentes dans les données + année courante
  const years = (() => {
    const set = new Set([2025, 2026, now.getFullYear()]);
    data.forEach((c) => Object.keys(c.pay || {}).forEach((k) => set.add(+k.split('-')[0])));
    return [...set].sort((a, b) => b - a);
  })();

  // stats du mois sélectionné
  const moisLocs = data; // tous les locataires concernés
  const paidThis = moisLocs.filter((c) => isPaid(c, year, month));
  const dueThis = moisLocs.filter((c) => !isPaid(c, year, month));
  const encThisMonth = paidThis.reduce((s, c) => s + paidAmount(c, key(year, month)), 0);
  const dueThisMonth = dueThis.reduce((s, c) => s + (c.rent || 0), 0);
  // stats année
  const encYear = data.reduce((s, c) => {
    let total = 0;
    for (let m = 0; m < 12; m++) if (isPaid(c, year, m)) total += paidAmount(c, key(year, m));
    return s + total;
  }, 0);
  const expectedYear = data.reduce((s, c) => s + (c.rent || 0) * 12, 0);

  const openPay = (c) => {
    if (ro) return;
    const ex = c.pay && c.pay[key(year, month)];
    setPayForm({
      mode: ex ? ex.mode : 'espece',
      date: ex ? ex.date : `${year}-${String(month + 1).padStart(2, '0')}-10`,
      montant: c.rent,
    });
    setPayModal(c);
  };
  const confirmPay = () => {
    if (!payForm.date) return;
    const c = payModal;
    const u = data.map((x) => {
      if (x.id !== c.id) return x;
      const pay = { ...(x.pay || {}) };
      pay[key(year, month)] = { date: payForm.date, mode: payForm.mode, montant: c.rent };
      return { ...x, pay };
    });
    setData(u);
    save(u);
    setPayModal(null);
  };
  const cancelPay = (c) => {
    if (ro) return;
    if (!confirm('Annuler le paiement de ' + c.name + ' pour ' + MOIS12[month] + ' ' + year + ' ?'))
      return;
    const u = data.map((x) => {
      if (x.id !== c.id) return x;
      const pay = { ...(x.pay || {}) };
      delete pay[key(year, month)];
      return { ...x, pay };
    });
    setData(u);
    save(u);
  };

  // CRUD locataire
  const linkLocBien = (locId, bienId, baseLocs, baseBiens) => {
    const bId = bienId ? +bienId : null;
    let nl = baseLocs.map((l) =>
      l.id === locId ? { ...l, bienId: bId } : bId && l.bienId === bId ? { ...l, bienId: null } : l,
    );
    let nb = baseBiens.map((b) =>
      b.id === bId
        ? { ...b, locataireId: locId }
        : b.locataireId === locId && b.id !== bId
          ? { ...b, locataireId: null }
          : b,
    );
    return { nl, nb };
  };
  const doSaveLoc = () => {
    if (!form.name.trim() || form.rent < 0) return;
    let base = eid
      ? data.map((c) => (c.id === eid ? { ...c, name: form.name, rent: +form.rent || 0 } : c))
      : [
          ...data,
          { id: Date.now(), name: form.name, rent: +form.rent || 0, pay: {}, bienId: null },
        ];
    const targetId = eid || base[base.length - 1].id;
    const { nl, nb } = linkLocBien(targetId, form.bienId, base, biens);
    setData(nl);
    save(nl);
    setBiens(nb);
    saveBiens(nb);
    setEid(null);
    setEdit(false);
  };
  const editLoc = (c) => {
    setF({ name: c.name, rent: c.rent, bienId: c.bienId || '' });
    setEid(c.id);
    setEdit(true);
  };
  const addLoc = () => {
    setEid(null);
    setF({ name: '', rent: 0, bienId: '' });
    setEdit(true);
  };
  const delLoc = (id) => {
    if (!confirm('Supprimer ce locataire ?')) return;
    const nl = data.filter((x) => x.id !== id);
    const nb = biens.map((b) => (b.locataireId === id ? { ...b, locataireId: null } : b));
    setData(nl);
    save(nl);
    setBiens(nb);
    saveBiens(nb);
  };
  const bienOpts = [{ id: '', name: '— Aucun —' }].concat(
    biens
      .filter((b) => !b.locataireId || b.locataireId === eid)
      .map((b) => ({ id: b.id, name: b.nom + (b.loyer ? ' (' + fmt(b.loyer) + '/m)' : '') })),
  );

  const pct = moisLocs.length ? Math.round((paidThis.length / moisLocs.length) * 100) : 0;

  return (
    <div>
      {/* DASHBOARD LOYERS */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1e40af,#7c3aed)',
          borderRadius: 18,
          padding: '20px 22px',
          color: '#fff',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(59,130,246,0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              opacity: 0.85,
            }}
          >
            Loyers encaissés · {MOIS12[month]} {year}
          </div>
          <div
            className="mono"
            style={{ fontSize: 32, fontWeight: 800, marginTop: 6, lineHeight: 1 }}
          >
            {fmt(encThisMonth)} <span style={{ fontSize: 15, opacity: 0.7 }}>MAD</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '3px 10px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              ✓ {paidThis.length} payé(s)
            </span>
            <span
              style={{
                padding: '3px 10px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              ⏳ {dueThis.length} en attente · {fmt(dueThisMonth)}
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              height: 7,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 5,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: pct + '%',
                height: '100%',
                background: '#fff',
                borderRadius: 5,
                transition: 'width .4s',
              }}
            />
          </div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 5 }}>
            {pct}% des loyers du mois recouvrés · Année {year} : {fmt(encYear)} /{' '}
            {fmt(expectedYear)}
          </div>
        </div>
      </div>

      {/* PARTS DES PROPRIETAIRES POUR CE MOIS */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            padding: '11px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            ⚖️ Parts des propriétaires · {MOIS12[month]} {year}
          </h4>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
            {fmt(encThisMonth)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            height: 34,
            margin: '12px 16px 6px',
            borderRadius: 9,
            overflow: 'hidden',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              flex: 75,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Hajar 75%
          </div>
          <div
            style={{
              flex: 25,
              background: '#334155',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Malika 25%
          </div>
        </div>
        <div
          style={{
            padding: '6px 16px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{OWNERS.hajar.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>75% des loyers encaissés ce mois</div>
          </div>
          <div className="mono" style={{ fontWeight: 800, fontSize: 16, color: '#3b82f6' }}>
            {fmt(encThisMonth * 0.75)}
          </div>
        </div>
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{OWNERS.malika.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>25% des loyers encaissés ce mois</div>
          </div>
          <div className="mono" style={{ fontWeight: 800, fontSize: 16, color: '#334155' }}>
            {fmt(encThisMonth * 0.25)}
          </div>
        </div>
        <div
          style={{ padding: '9px 16px', background: '#f8fafc', fontSize: 10.5, color: '#94a3b8' }}
        >
          Sur l'année {year} : Hajar {fmt(encYear * 0.75)} · Malika {fmt(encYear * 0.25)}
        </div>
      </div>

      {/* SELECTEUR ANNEE */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 10,
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        >
          Année
        </span>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              border: '1.5px solid ' + (year === y ? '#3b82f6' : '#e2e8f0'),
              background: year === y ? '#3b82f6' : '#fff',
              color: year === y ? '#fff' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {y}
          </button>
        ))}
      </div>
      {/* SELECTEUR MOIS */}
      <div
        style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}
      >
        {MOIS_C.map((m, i) => {
          const enc = data.filter((c) => isPaid(c, year, i)).length;
          const tot = data.length;
          const full = tot > 0 && enc === tot;
          return (
            <button
              key={i}
              onClick={() => setMonth(i)}
              style={{
                flexShrink: 0,
                minWidth: 52,
                padding: '8px 6px',
                borderRadius: 10,
                border: '1.5px solid ' + (month === i ? '#3b82f6' : '#e2e8f0'),
                background: month === i ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: month === i ? '#3b82f6' : '#475569',
                }}
              >
                {m}
              </div>
              <div
                style={{
                  fontSize: 9,
                  marginTop: 3,
                  color: full ? '#16a34a' : '#94a3b8',
                  fontWeight: 600,
                }}
              >
                {enc}/{tot}
              </div>
            </button>
          );
        })}
      </div>

      {!ro && (
        <div style={{ marginBottom: 12 }}>
          <Btn onClick={addLoc} c="#16a34a">
            + Locataire
          </Btn>
        </div>
      )}

      {/* LISTE LOCATAIRES DU MOIS */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          margin: '4px 4px 8px',
        }}
      >
        {MOIS12[month]} {year} — qui a payé / qui doit
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((c) => {
          const paid = isPaid(c, year, month);
          const info = paid ? c.pay[key(year, month)] : null;
          const mm = info ? modeMeta(info.mode) : null;
          const bn = bienName(c.bienId);
          return (
            <div
              key={c.id}
              style={{
                background: '#fff',
                borderRadius: 13,
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid ' + (paid ? '#16a34a' : '#f59e0b'),
                padding: '13px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                    {paid ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: 20,
                          background: '#dcfce7',
                          color: '#16a34a',
                        }}
                      >
                        ✓ PAYÉ
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: 20,
                          background: '#fef3c7',
                          color: '#b45309',
                        }}
                      >
                        ⏳ À PAYER
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    {fmt(c.rent)}/mois{bn ? ' · 🏛 ' + bn : ''}
                  </div>
                  {paid && (
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 9px',
                          borderRadius: 20,
                          background: mm.c + '18',
                          color: mm.c,
                          fontWeight: 600,
                        }}
                      >
                        {mm.ic} {mm.l}
                      </span>
                      <span style={{ color: '#94a3b8' }}>
                        le {info.date ? new Date(info.date).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 6,
                  }}
                >
                  {!ro &&
                    (paid ? (
                      <button
                        onClick={() => cancelPay(c)}
                        style={{
                          padding: '8px 13px',
                          border: '1.5px solid #fecaca',
                          background: '#fff',
                          color: '#dc2626',
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Annuler
                      </button>
                    ) : (
                      <button
                        onClick={() => openPay(c)}
                        style={{
                          padding: '9px 15px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#fff',
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                        }}
                      >
                        Valider
                      </button>
                    ))}
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => setHistLoc(c)}
                      title="Historique"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#64748b',
                        padding: 3,
                      }}
                    >
                      📅
                    </button>
                    {!ro && (
                      <button
                        onClick={() => editLoc(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: '#3b82f6',
                          padding: 3,
                        }}
                        aria-label="Modifier"
                      >
                        &#9998;
                      </button>
                    )}
                    {!ro && (
                      <button
                        onClick={() => delLoc(c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: '#ef4444',
                          padding: 3,
                        }}
                        aria-label="Supprimer"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!data.length && (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 12,
              background: '#fff',
              borderRadius: 13,
              border: '1px dashed #e2e8f0',
            }}
          >
            Aucun locataire. Touchez « + Locataire ».
          </div>
        )}
      </div>

      {/* MODAL VALIDATION PAIEMENT */}
      <Modal
        show={!!payModal}
        onClose={() => setPayModal(null)}
        title={payModal ? 'Paiement — ' + payModal.name : ''}
      >
        {payModal && (
          <div>
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: 12,
                color: '#475569',
              }}
            >
              <b>
                {MOIS12[month]} {year}
              </b>{' '}
              · Loyer dû : <b className="mono">{fmt(payModal.rent)} MAD</b>
            </div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 600,
                color: '#64748b',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Mode de règlement
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                marginBottom: 14,
              }}
            >
              {PAY_MODES.map((m) => (
                <button
                  key={m.k}
                  onClick={() => setPayForm({ ...payForm, mode: m.k })}
                  style={{
                    padding: '12px 4px',
                    borderRadius: 11,
                    border: '2px solid ' + (payForm.mode === m.k ? m.c : '#e2e8f0'),
                    background: payForm.mode === m.k ? m.c + '12' : '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20 }}>{m.ic}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 3,
                      color: payForm.mode === m.k ? m.c : '#475569',
                    }}
                  >
                    {m.l}
                  </div>
                </button>
              ))}
            </div>
            <Inp
              l="Date du paiement"
              v={payForm.date}
              onChange={(v) => setPayForm({ ...payForm, date: v })}
              type="date"
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
              <Btn onClick={() => setPayModal(null)} outline c="#64748b">
                Annuler
              </Btn>
              <Btn onClick={confirmPay} disabled={!payForm.date} c="#16a34a">
                ✓ Confirmer le paiement
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL HISTORIQUE LOCATAIRE */}
      <Modal
        show={!!histLoc}
        onClose={() => setHistLoc(null)}
        title={histLoc ? 'Historique — ' + histLoc.name : ''}
      >
        {histLoc && (
          <div>
            {years.map((y) => {
              const paidN = (() => {
                let n = 0;
                for (let m = 0; m < 12; m++) if (isPaid(histLoc, y, m)) n++;
                return n;
              })();
              return (
                <div key={y} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{y}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: paidN === 12 ? '#16a34a' : '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      {paidN}/12 ·{' '}
                      {fmt(
                        Object.keys(histLoc.pay || {})
                          .filter((k) => k.startsWith(y + '-'))
                          .reduce((total, k) => total + paidAmount(histLoc, k), 0),
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 5 }}>
                    {MOIS_C.map((m, i) => {
                      const p = isPaid(histLoc, y, i);
                      const info = p ? histLoc.pay[key(y, i)] : null;
                      const mm = info ? modeMeta(info.mode) : null;
                      return (
                        <div
                          key={i}
                          style={{
                            border: '1.5px solid ' + (p ? '#86efac' : '#e2e8f0'),
                            borderRadius: 8,
                            padding: '6px 2px',
                            textAlign: 'center',
                            background: p ? '#f0fdf4' : '#f8fafc',
                          }}
                        >
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{m}</div>
                          <div
                            style={{ fontSize: 13, marginTop: 2, color: p ? '#16a34a' : '#cbd5e1' }}
                          >
                            {p ? mm.ic : '○'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* MODAL EDITION LOCATAIRE */}
      <Modal
        show={edit}
        onClose={() => setEdit(false)}
        title={eid ? 'Modifier le locataire' : 'Nouveau locataire'}
      >
        <Inp l="Nom" v={form.name} onChange={(v) => setF({ ...form, name: v })} ph="Ex: Benani" />
        <Inp
          l="Loyer mensuel (MAD)"
          v={form.rent}
          onChange={(v) => setF({ ...form, rent: v })}
          type="number"
        />
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 600,
              color: '#64748b',
              marginBottom: 3,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Bien loué
          </label>
          <select
            value={form.bienId}
            onChange={(e) => setF({ ...form, bienId: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              background: '#fff',
              boxSizing: 'border-box',
            }}
          >
            {bienOpts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn onClick={() => setEdit(false)} outline c="#64748b">
            Annuler
          </Btn>
          <Btn onClick={doSaveLoc} disabled={!form.name}>
            {eid ? 'Modifier' : 'Ajouter'}
          </Btn>
        </div>
      </Modal>
      {!ro && (
        <button className="fab" onClick={addLoc} aria-label="Nouveau locataire">
          +
        </button>
      )}
    </div>
  );
}

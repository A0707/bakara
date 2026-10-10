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

export default function Biens({ data, setData, save, ro, locs, setLocs, saveLocs }) {
  const [show, setShow] = useState(false),
    [fil, setFil] = useState('tous');
  const [form, setF] = useState({
      nom: '',
      type: 'Magasin',
      loyer: 0,
      prev: 0,
      surf: 0,
      statut: 'vide',
      locataireId: '',
    }),
    [eid, setEid] = useState(null);
  const totA = data.reduce((s, b) => s + (b.loyer || 0), 0),
    totP = data.reduce((s, b) => s + (b.prev || 0), 0);
  const locName = (id) => {
    const l = locs.find((x) => x.id === id);
    return l ? l.name : null;
  };
  const isLoue = (b) => !!b.locataireId;
  const vides = data.filter((b) => !isLoue(b)).length;
  let list = data;
  if (fil === 'loue') list = data.filter(isLoue);
  else if (fil === 'vide') list = data.filter((b) => !isLoue(b));
  else if (fil === 'Magasin') list = data.filter((b) => b.type.startsWith('Magasin'));
  else if (fil === 'Appartement')
    list = data.filter((b) => b.type.startsWith('Appartement') || b.type === 'Studio');

  // Synchronise le lien des deux côtés : un bien pointe vers un locataire, le locataire pointe vers le bien
  const linkBienLoc = (bienId, locataireId, baseBiens, baseLocs) => {
    const bId = bienId,
      lId = locataireId ? +locataireId : null;
    // 1) libère l'ancien locataire de ce bien + libère le bien que prenait ce locataire ailleurs
    let nb = baseBiens.map((b) => {
      if (b.id === bId) return { ...b, locataireId: lId };
      if (lId && b.locataireId === lId) return { ...b, locataireId: null }; // ce locataire quitte son ancien bien
      return b;
    });
    let nl = baseLocs.map((l) => {
      if (l.id === lId) return { ...l, bienId: bId };
      if (l.bienId === bId && l.id !== lId) return { ...l, bienId: null }; // ancien locataire de ce bien est délié
      return l;
    });
    return { nb, nl };
  };

  const doSave = () => {
    if (!form.nom.trim() || form.loyer < 0 || form.prev < 0 || form.surf < 0) return;
    // "Loué" exige un locataire ; "Vide" délie tout locataire
    if (form.statut === 'loue' && !form.locataireId) {
      alert('Pour un bien « Loué », choisissez un locataire.');
      return;
    }
    const locId = form.statut === 'loue' ? form.locataireId : '';
    const obj = {
      nom: form.nom,
      type: form.type,
      loyer: +form.loyer || 0,
      prev: +form.prev || 0,
      surf: +form.surf || 0,
    };
    let base = eid
      ? data.map((x) => (x.id === eid ? { ...x, ...obj } : x))
      : [...data, { ...obj, id: Date.now(), num: data.length + 1, locataireId: null }];
    const targetId = eid || base[base.length - 1].id;
    const { nb, nl } = linkBienLoc(targetId, locId, base, locs);
    setData(nb);
    save(nb);
    setLocs(nl);
    saveLocs(nl);
    setEid(null);
    setShow(false);
  };
  const doEdit = (b) => {
    setF({
      nom: b.nom,
      type: b.type,
      loyer: b.loyer,
      prev: b.prev,
      surf: b.surf,
      statut: b.locataireId ? 'loue' : 'vide',
      locataireId: b.locataireId || '',
    });
    setEid(b.id);
    setShow(true);
  };
  const doAdd = () => {
    setEid(null);
    setF({ nom: '', type: 'Magasin', loyer: 0, prev: 0, surf: 0, statut: 'vide', locataireId: '' });
    setShow(true);
  };
  const doDel = (id) => {
    if (!confirm('Supprimer ce bien ?')) return;
    const nb = data.filter((x) => x.id !== id);
    const nl = locs.map((l) => (l.bienId === id ? { ...l, bienId: null } : l));
    setData(nb);
    save(nb);
    setLocs(nl);
    saveLocs(nl);
  };
  const chip = (k, lbl) => (
    <button
      onClick={() => setFil(k)}
      style={{
        padding: '7px 13px',
        borderRadius: 20,
        border: '1.5px solid ' + (fil === k ? '#3b82f6' : '#e2e8f0'),
        background: fil === k ? '#3b82f6' : '#fff',
        color: fil === k ? '#fff' : '#64748b',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {lbl}
    </button>
  );
  // locataires disponibles pour le select (non liés, ou lié au bien courant)
  const locOpts = [{ id: '', name: '— Vacant —' }].concat(
    locs
      .filter((l) => !l.bienId || l.bienId === eid)
      .map((l) => ({ id: l.id, name: l.name + ' (' + fmt(l.rent) + '/m)' })),
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #16a34a',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#16a34a',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Loyer actuel/mois
          </div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
            {fmt(totA)}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{data.length} bien(s)</div>
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#f59e0b',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Previsionnel/mois
          </div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
            {fmt(totP)}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{vides} vide(s)</div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        {!ro && (
          <Btn onClick={doAdd} c="#16a34a">
            + Bien
          </Btn>
        )}
        {chip('tous', 'Tous')}
        {chip('loue', 'Loués')}
        {chip('vide', 'Vides')}
        {chip('Magasin', 'Magasins')}
        {chip('Appartement', 'Apparts')}
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
        {list.map((b, i) => {
          const ln = locName(b.locataireId);
          return (
            <div
              key={b.id}
              style={{
                padding: '13px 16px',
                borderTop: i ? '1px solid #f1f5f9' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{b.nom}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                  {b.surf ? b.surf + ' m² · ' : ''}
                  {ln ? '👤 ' + ln : 'Disponible'}
                </div>
                <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <Badge t={b.type.split('/')[0]} c="#64748b" />
                  <Badge t={ln ? 'Loué' : 'Vide'} c={ln ? '#16a34a' : '#dc2626'} />
                </div>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 800, color: b.loyer ? '#16a34a' : '#f59e0b' }}
                >
                  {b.loyer ? fmt(b.loyer) : 'prév. ' + fmt(b.prev)}
                </div>
                {!ro && (
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => doEdit(b)}
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
                      onClick={() => doDel(b.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#ef4444',
                        padding: 3,
                      }}
                      aria-label="Supprimer"
                    >
                      &#10005;
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!list.length && (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            Aucun bien dans ce filtre.
          </div>
        )}
      </div>
      <Modal
        show={show}
        onClose={() => setShow(false)}
        title={eid ? 'Modifier le bien' : 'Nouveau bien'}
      >
        <Inp
          l="Nom / désignation"
          v={form.nom}
          onChange={(v) => setF({ ...form, nom: v })}
          ph="Ex: Magasin n°18"
        />
        <Inp
          l="Type"
          v={form.type}
          onChange={(v) => setF({ ...form, type: v })}
          opts={['Magasin', 'Appartement', 'Studio', 'Appartement/Bidonville']}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Inp
            l="Loyer actuel"
            v={form.loyer}
            onChange={(v) => setF({ ...form, loyer: v })}
            type="number"
          />
          <Inp
            l="Loyer prévis."
            v={form.prev}
            onChange={(v) => setF({ ...form, prev: v })}
            type="number"
          />
        </div>
        <Inp
          l="Surface m²"
          v={form.surf}
          onChange={(v) => setF({ ...form, surf: v })}
          type="number"
        />
        <div style={{ marginBottom: 12 }}>
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
            Statut
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => setF({ ...form, statut: 'loue' })}
              style={{
                padding: '11px',
                borderRadius: 10,
                border: '2px solid ' + (form.statut === 'loue' ? '#16a34a' : '#e2e8f0'),
                background: form.statut === 'loue' ? '#f0fdf4' : '#fff',
                color: form.statut === 'loue' ? '#16a34a' : '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Loué
            </button>
            <button
              onClick={() => setF({ ...form, statut: 'vide', locataireId: '' })}
              style={{
                padding: '11px',
                borderRadius: 10,
                border: '2px solid ' + (form.statut === 'vide' ? '#dc2626' : '#e2e8f0'),
                background: form.statut === 'vide' ? '#fef2f2' : '#fff',
                color: form.statut === 'vide' ? '#dc2626' : '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Vide
            </button>
          </div>
        </div>
        {form.statut === 'loue' && (
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
              Locataire <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={form.locataireId}
              onChange={(e) => setF({ ...form, locataireId: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1.5px solid ' + (form.locataireId ? '#e2e8f0' : '#fca5a5'),
                borderRadius: 8,
                fontSize: 13,
                background: '#fff',
                boxSizing: 'border-box',
              }}
            >
              {locOpts.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              Obligatoire pour un bien loué. Pour créer un locataire, allez dans l'onglet Loyers.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn onClick={() => setShow(false)} outline c="#64748b">
            Annuler
          </Btn>
          <Btn onClick={doSave} disabled={!form.nom}>
            {eid ? 'Modifier' : 'Ajouter'}
          </Btn>
        </div>
      </Modal>
      {!ro && (
        <button className="fab" onClick={doAdd} aria-label="Nouveau bien">
          +
        </button>
      )}
    </div>
  );
}

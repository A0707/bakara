import React, { useState } from 'react';
import {
  Button,
  Badge,
  Modal,
  RecordForm,
  Stat,
  Money,
  Field,
  EmptyState,
  ConfirmDelete,
  PanelHeader,
} from '../components/UI';
import RecordActions from '../components/RecordActions';
import Icon from '../components/Icon';
import { MOIS12, MOIS_C, PAY_MODES, OWNERS, modeMeta } from '../lib/data';
import { paidAmount, rentMetrics } from '../lib/metrics';
import {
  saveTenant,
  removeTenant,
  savePayment,
  removePayment,
  dateToday,
} from '../lib/financeModel';
const blank = () => ({ name: '', rent: 0, bienId: '', pay: {} });
export default function Loyers({ data, mutate, readOnly, initialAction }) {
  const now = new Date(),
    [year, setYear] = useState(now.getFullYear()),
    [month, setMonth] = useState(now.getMonth()),
    [filter, setFilter] = useState('all'),
    [query, setQuery] = useState('');
  const [editor, setEditor] = useState(() => (initialAction === 'new' ? blank() : null)),
    [payment, setPayment] = useState(null),
    [history, setHistory] = useState(null),
    [deletion, setDeletion] = useState(null),
    [cancel, setCancel] = useState(null);
  const key = `${year}-${month}`,
    tenants = data.locataires;
  const years = [
    ...new Set([
      now.getFullYear(),
      2025,
      2026,
      ...tenants.flatMap((l) => Object.keys(l.pay || {}).map((k) => Number(k.split('-')[0]))),
    ]),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const stats = rentMetrics(tenants, new Date(year, month, 15));
  const annual = tenants.reduce(
    (sum, l) =>
      sum +
      Object.keys(l.pay || {})
        .filter((k) => k.startsWith(year + '-'))
        .reduce((total, k) => total + paidAmount(l, k), 0),
    0,
  );
  const list = tenants.filter(
    (l) =>
      (filter === 'all' || (filter === 'paid' ? !!l.pay?.[key] : !l.pay?.[key])) &&
      l.name.toLowerCase().includes(query.toLowerCase()),
  );
  const fields = [
    {
      key: 'name',
      label: 'Nom du locataire',
      required: true,
      full: true,
      placeholder: 'Nom et prénom',
    },
    { key: 'rent', label: 'Loyer mensuel (MAD)', type: 'number', required: true },
    {
      key: 'bienId',
      label: 'Bien loué',
      options: [
        { value: '', label: 'Aucun bien associé' },
        ...data.biens
          .filter((b) => !b.locataireId || b.locataireId === editor?.id)
          .map((b) => ({ value: b.id, label: b.nom })),
      ],
    },
  ];
  return (
    <div className="page-stack">
      <section className="rent-hero">
        <div>
          <span className="eyebrow">LE RENDEZ-VOUS DU MOIS</span>
          <h2>
            {MOIS12[month]} {year}
          </h2>
          <div className="rent-hero-number">
            <Money value={stats.received} />
            <span>encaissés</span>
          </div>
          <p>
            {stats.paid.length} loyer{stats.paid.length > 1 ? 's' : ''} réglé
            {stats.paid.length > 1 ? 's' : ''} sur {tenants.length}
          </p>
        </div>
        <div className="rent-hero-side">
          <span>{stats.pct}%</span>
          <p>des loyers réglés</p>
          <div className="progress-track">
            <span style={{ width: stats.pct + '%' }} />
          </div>
          <Badge tone="amber">{stats.unpaid.length} en attente</Badge>
        </div>
      </section>
      <div className="stats-grid">
        <Stat
          label="Reste à recevoir ce mois"
          value={<Money value={stats.due} />}
          detail={`${stats.unpaid.length} locataire${stats.unpaid.length > 1 ? 's' : ''} en attente`}
          icon="clock"
          tone="amber"
        />
        <Stat
          label={`Encaissé en ${year}`}
          value={<Money value={annual} />}
          detail="Montants des paiements enregistrés"
          icon="wallet"
          tone="mint"
        />
      </div>
      <section className="panel">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">PAIEMENTS & LOCATAIRES</span>
            <h2>Qui a réglé son loyer ?</h2>
          </div>
          {!readOnly && (
            <Button icon="plus" onClick={() => setEditor(blank())}>
              Nouveau locataire
            </Button>
          )}
        </div>
        <div className="period-toolbar">
          <Field
            label="Année"
            value={year}
            onChange={(v) => setYear(Number(v))}
            options={years.map((y) => ({ value: y, label: y }))}
          />
          <div className="month-list" role="group" aria-label="Mois du suivi">
            {MOIS_C.map((m, i) => (
              <button
                key={m}
                className={i === month ? 'selected' : ''}
                aria-pressed={i === month}
                onClick={() => setMonth(i)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-toolbar">
          <div className="search-field">
            <Icon name="search" />
            <Field
              label="Rechercher un locataire"
              value={query}
              onChange={setQuery}
              placeholder="Nom du locataire…"
            />
          </div>
          <Field
            label="Statut de paiement"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Tous les locataires' },
              { value: 'unpaid', label: 'À régler' },
              { value: 'paid', label: 'Réglés' },
            ]}
          />
        </div>
        <div className="tenant-list">
          {list.map((l) => {
            const paid = !!l.pay?.[key],
              info = l.pay?.[key],
              property = data.biens.find((b) => b.id === l.bienId);
            return (
              <article className={`tenant-card ${paid ? 'paid' : ''}`} key={l.id}>
                <div className="tenant-main">
                  <span className="tenant-avatar">{l.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <h3>{l.name}</h3>
                    <p>{property?.nom || 'Sans bien associé'}</p>
                    <div className="tenant-tags">
                      <Badge tone={paid ? 'mint' : 'amber'}>{paid ? 'Réglé' : 'À régler'}</Badge>
                      {paid && (
                        <span>
                          {modeMeta(info.mode).l} · {info.date || 'Date non renseignée'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="tenant-payment">
                  <Money value={paid ? paidAmount(l, key) : l.rent} />
                  <span>{paid ? 'payé ce mois' : 'à recevoir ce mois'}</span>
                </div>
                <div className="tenant-actions">
                  {!readOnly && (
                    <Button
                      small
                      variant={paid ? 'secondary' : 'primary'}
                      icon={paid ? 'close' : 'check'}
                      onClick={() => (paid ? setCancel(l) : setPayment(l))}
                    >
                      {paid ? 'Annuler le paiement' : 'Enregistrer le paiement'}
                    </Button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Historique de ${l.name}`}
                    onClick={() => setHistory(l)}
                  >
                    <Icon name="clock" size={18} />
                  </button>
                  {!readOnly && (
                    <RecordActions
                      label={l.name}
                      onEdit={() => setEditor({ ...l, bienId: l.bienId ?? '' })}
                      onDelete={() => setDeletion(l)}
                    />
                  )}
                </div>
              </article>
            );
          })}
          {!list.length && (
            <EmptyState
              title="Aucun locataire à afficher"
              description={
                tenants.length
                  ? 'Modifiez la recherche ou le filtre.'
                  : 'Ajoutez un locataire pour commencer le suivi.'
              }
              icon="users"
            />
          )}
        </div>
      </section>
      <section className="panel owner-panel">
        <PanelHeader
          eyebrow="UNE GESTION PARTAGÉE"
          title="Répartition des encaissements"
          action={
            <Badge tone="violet">
              {MOIS12[month]} {year}
            </Badge>
          }
        />
        <div className="owner-grid">
          {Object.entries(OWNERS).map(([id, owner]) => (
            <div className="owner-card" key={id}>
              <span className={`owner-avatar ${id === 'hajar' ? 'violet' : 'blue'}`}>
                {owner.name[0]}
              </span>
              <div>
                <h3>{owner.name}</h3>
                <p>{owner.pct * 100}% des loyers encaissés</p>
              </div>
              <Money value={stats.received * owner.pct} />
              <small className="owner-annual">
                En {year} : <Money value={annual * owner.pct} />
              </small>
            </div>
          ))}
        </div>
        <p className="owner-footnote">
          Répartition indicative des loyers encaissés. Les loyers sont suivis séparément de la
          caisse.
        </p>
      </section>
      <Modal
        show={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Modifier le locataire' : 'Nouveau locataire'}
      >
        {editor && (
          <RecordForm
            key={editor.id || 'new'}
            initial={editor}
            fields={fields}
            onCancel={() => setEditor(null)}
            onSubmit={async (form) => {
              await mutate((snapshot) => saveTenant(snapshot, form));
              setEditor(null);
            }}
          />
        )}
      </Modal>
      <Modal show={!!payment} onClose={() => setPayment(null)} title="Enregistrer le paiement">
        {payment && (
          <>
            <div className="payment-summary">
              <span>
                {payment.name} · {MOIS12[month]} {year}
              </span>
              <Money value={payment.rent} />
            </div>
            <RecordForm
              key={payment.id}
              initial={{ date: dateToday(), mode: 'espece' }}
              fields={[
                { key: 'date', label: 'Date du paiement', type: 'date', required: true },
                {
                  key: 'mode',
                  label: 'Mode de règlement',
                  options: PAY_MODES.map((m) => ({ value: m.k, label: m.l })),
                  required: true,
                },
              ]}
              submitLabel="Confirmer le paiement"
              onCancel={() => setPayment(null)}
              onSubmit={async (form) => {
                await mutate((snapshot) => savePayment(snapshot, payment.id, key, form));
                setPayment(null);
              }}
            />
          </>
        )}
      </Modal>
      <Modal
        show={!!history}
        onClose={() => setHistory(null)}
        title={`Historique · ${history?.name || ''}`}
      >
        {history && (
          <div className="history-list">
            {years.map((y) => (
              <section key={y}>
                <div className="history-year">
                  <h3>{y}</h3>
                  <Money
                    value={Object.keys(history.pay || {})
                      .filter((k) => k.startsWith(y + '-'))
                      .reduce((total, k) => total + paidAmount(history, k), 0)}
                  />
                </div>
                <div className="history-months">
                  {MOIS_C.map((m, i) => {
                    const info = history.pay?.[`${y}-${i}`];
                    return (
                      <div className={info ? 'paid' : ''} key={m}>
                        <span>{m}</span>
                        <strong>{info ? 'Réglé' : 'Non réglé'}</strong>
                        {info && <small>{modeMeta(info.mode).l}</small>}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Modal>
      <ConfirmDelete
        show={!!deletion}
        title="Supprimer le locataire ?"
        description={`Supprimer « ${deletion?.name || ''} » et son historique de paiements ? Son bien sera conservé et libéré.`}
        onClose={() => setDeletion(null)}
        onConfirm={() => mutate((snapshot) => removeTenant(snapshot, deletion.id))}
      />
      <ConfirmDelete
        show={!!cancel}
        title="Annuler ce paiement ?"
        description={`Le paiement de ${cancel?.name || ''} pour ${MOIS12[month]} ${year} sera retiré de l’historique.`}
        onClose={() => setCancel(null)}
        onConfirm={() => mutate((snapshot) => removePayment(snapshot, cancel.id, key))}
      />
    </div>
  );
}

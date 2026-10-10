import React, { useState } from 'react';
import {
  Button,
  Stat,
  Money,
  Badge,
  Modal,
  RecordForm,
  ConfirmDelete,
  EmptyState,
  Field,
} from '../components/UI';
import RecordActions from '../components/RecordActions';
import Icon from '../components/Icon';
import { CATS } from '../lib/data';
import { sum } from '../lib/metrics';
import { saveLedger, dateToday } from '../lib/financeModel';
const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('fr-MA', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value + 'T12:00:00'),
      )
    : 'Date non renseignée';
const entryTypes = ['Echeance', 'Cheque', 'Virement', 'Espece', 'Autre'];
export default function Ledger({ kind, data, mutate, readOnly, initialAction }) {
  const expense = kind === 'charges',
    nameField = expense ? 'd' : 's';
  const empty = () =>
    expense ? { d: '', c: '', date: dateToday(), m: '', n: '' } : { s: '', m: '', t: '', p: '' };
  const [editor, setEditor] = useState(() => (initialAction === 'new' ? empty() : null)),
    [deletion, setDeletion] = useState(null),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('');
  const rows = data[kind];
  const list = rows
    .filter(
      (row) =>
        (!filter || (expense ? row.c : row.t) === filter) &&
        normalize(`${row[nameField]} ${expense ? row.n : row.p}`).includes(normalize(query)),
    )
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || Number(b.id) - Number(a.id));
  const fields = expense
    ? [
        {
          key: 'd',
          label: 'Désignation',
          required: true,
          full: true,
          placeholder: 'Ex. Entretien du logement',
        },
        {
          key: 'c',
          label: 'Catégorie',
          options: [{ value: '', label: 'Choisir une catégorie' }, ...CATS],
          required: true,
        },
        { key: 'm', label: 'Montant (MAD)', type: 'number', required: true, min: 0.01 },
        {
          key: 'date',
          label: 'Date',
          type: 'date',
          required: !editor?.id || !!editor?.date,
          help:
            editor?.id && !editor?.date
              ? 'La période historique est conservée si la date reste vide.'
              : undefined,
        },
        { key: 'n', label: 'Notes', placeholder: 'Informations complémentaires', full: true },
      ]
    : [
        {
          key: 's',
          label: 'Source',
          required: true,
          full: true,
          placeholder: 'Ex. Virement familial',
        },
        { key: 'm', label: 'Montant (MAD)', type: 'number', required: true, min: 0.01 },
        {
          key: 't',
          label: 'Type',
          options: [{ value: '', label: 'Choisir un type' }, ...entryTypes],
        },
        { key: 'p', label: 'Période', placeholder: 'Ex. Octobre 2026', full: true },
      ];
  const add = () => setEditor(empty());
  const actions = (row) =>
    !readOnly && (
      <RecordActions
        label={row[nameField]}
        onEdit={() => setEditor({ ...row })}
        onDelete={() => setDeletion(row)}
      />
    );
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <Stat
          label={expense ? 'Dépenses cumulées' : 'Entrées cumulées'}
          value={<Money value={sum(rows)} />}
          icon={expense ? 'down' : 'up'}
          tone={expense ? 'rose' : 'mint'}
          detail={`${rows.length} opération${rows.length > 1 ? 's' : ''}`}
        />
        <Stat
          label="Résultat de la recherche"
          value={<Money value={sum(list)} />}
          icon="search"
          tone="blue"
          detail={`${list.length} opération${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''}`}
        />
      </div>
      <section className="panel">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">
              {expense ? 'CHAQUE DÉPENSE COMPTE' : 'VOS SOURCES DE FINANCEMENT'}
            </span>
            <h2>{expense ? 'Toutes les charges' : 'Toutes les entrées'}</h2>
          </div>
          {!readOnly && (
            <Button icon="plus" onClick={add}>
              {expense ? 'Nouvelle charge' : 'Nouvelle entrée'}
            </Button>
          )}
        </div>
        <div className="filter-toolbar">
          <div className="search-field">
            <Icon name="search" />
            <Field
              label={expense ? 'Rechercher une charge' : 'Rechercher une entrée'}
              value={query}
              onChange={setQuery}
              placeholder={expense ? 'Désignation, notes…' : 'Source, période…'}
            />
          </div>
          <Field
            label={expense ? 'Filtrer par catégorie' : 'Filtrer par type'}
            value={filter}
            onChange={setFilter}
            options={[
              { value: '', label: expense ? 'Toutes les catégories' : 'Tous les types' },
              ...(expense ? CATS : entryTypes),
            ]}
          />
        </div>
        {list.length ? (
          <>
            <div className="ledger-table table-scroll">
              <table>
                <caption className="sr-only">
                  {expense ? 'Charges' : 'Entrées'} enregistrées
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{expense ? 'Désignation' : 'Source'}</th>
                    <th scope="col">{expense ? 'Catégorie' : 'Type'}</th>
                    <th scope="col">{expense ? 'Date / période' : 'Période'}</th>
                    <th scope="col" className="align-right">
                      Montant
                    </th>
                    {!readOnly && (
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row[nameField]}</strong>
                        {row.n && <small>{row.n}</small>}
                      </td>
                      <td>
                        <Badge tone={expense ? 'violet' : 'mint'}>
                          {(expense ? row.c : row.t) || 'Non précisé'}
                        </Badge>
                      </td>
                      <td>
                        {expense
                          ? row.date
                            ? formatDate(row.date)
                            : row.p || 'Non renseignée'
                          : row.p || 'Non renseignée'}
                      </td>
                      <td className={`align-right ${expense ? 'expense-text' : 'income-text'}`}>
                        <Money value={row.m} />
                      </td>
                      {!readOnly && <td className="align-right">{actions(row)}</td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      Total affiché · {list.length} opération{list.length > 1 ? 's' : ''}
                    </td>
                    <td className="align-right">
                      <Money value={sum(list)} />
                    </td>
                    {!readOnly && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="ledger-mobile">
              {list.map((row) => (
                <article className="transaction-card" key={row.id}>
                  <div className="transaction-card-main">
                    <span className={`transaction-symbol tone-${expense ? 'rose' : 'mint'}`}>
                      <Icon name={expense ? 'down' : 'up'} />
                    </span>
                    <div>
                      <h3>{row[nameField]}</h3>
                      <span>{(expense ? row.c : row.t) || 'Non précisé'}</span>
                    </div>
                  </div>
                  <div className="transaction-card-bottom">
                    <span>
                      {expense
                        ? row.date
                          ? formatDate(row.date)
                          : row.p || 'Non renseignée'
                        : row.p || 'Non renseignée'}
                    </span>
                    <Money value={row.m} />
                  </div>
                  {row.n && <p className="record-note">{row.n}</p>}
                  {!readOnly && <div className="mobile-record-actions">{actions(row)}</div>}
                </article>
              ))}
              <div className="list-total">
                <span>Total affiché</span>
                <Money value={sum(list)} />
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={
              rows.length
                ? 'Aucune opération trouvée'
                : expense
                  ? 'Votre première charge'
                  : 'Votre première entrée'
            }
            description={
              rows.length
                ? 'Modifiez votre recherche ou les filtres.'
                : 'Enregistrez une opération pour commencer le suivi.'
            }
            icon={expense ? 'down' : 'up'}
            action={
              !readOnly && (
                <Button onClick={add} icon="plus">
                  {expense ? 'Ajouter une charge' : 'Ajouter une entrée'}
                </Button>
              )
            }
          />
        )}
      </section>
      <Modal
        show={!!editor}
        onClose={() => setEditor(null)}
        title={
          editor?.id ? 'Modifier l’opération' : expense ? 'Nouvelle charge' : 'Nouvelle entrée'
        }
      >
        {editor && (
          <RecordForm
            key={editor.id || 'new'}
            initial={editor}
            fields={fields}
            onCancel={() => setEditor(null)}
            onSubmit={async (form) => {
              await mutate((snapshot) => saveLedger(snapshot, kind, form));
              setEditor(null);
            }}
          />
        )}
      </Modal>
      <ConfirmDelete
        show={!!deletion}
        description={`Supprimer « ${deletion?.[nameField] || ''} » ? Cette opération modifiera le solde de caisse.`}
        onClose={() => setDeletion(null)}
        onConfirm={() =>
          mutate((snapshot) => ({ [kind]: snapshot[kind].filter((row) => row.id !== deletion.id) }))
        }
      />
    </div>
  );
}

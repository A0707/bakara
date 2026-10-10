import React, { useState } from 'react';
import {
  Badge,
  Button,
  Field,
  Modal,
  RecordForm,
  Stat,
  Money,
  EmptyState,
  ConfirmDelete,
} from '../components/UI';
import Icon from '../components/Icon';
import { sum } from '../lib/metrics';
import { saveProperty, removeProperty } from '../lib/financeModel';
const blank = () => ({ nom: '', type: 'Magasin', loyer: 0, prev: 0, surf: 0, locataireId: '' });
export default function Biens({ data, mutate, readOnly, initialAction }) {
  const [editor, setEditor] = useState(() => (initialAction === 'new' ? blank() : null)),
    [deletion, setDeletion] = useState(null),
    [filter, setFilter] = useState('all'),
    [query, setQuery] = useState('');
  const properties = data.biens,
    occupied = properties.filter((b) => b.locataireId != null).length;
  const list = properties.filter(
    (b) =>
      (filter === 'all' ||
        (filter === 'occupied' ? b.locataireId != null : b.locataireId == null)) &&
      `${b.nom} ${b.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  const fields = [
    {
      key: 'nom',
      label: 'Nom du bien',
      required: true,
      full: true,
      placeholder: 'Ex. Appartement centre-ville',
    },
    {
      key: 'type',
      label: 'Type',
      required: true,
      options: ['Magasin', 'Appartement', 'Studio', 'Appartement/Bidonville'],
    },
    { key: 'surf', label: 'Surface (m²)', type: 'number' },
    { key: 'loyer', label: 'Loyer actuel (MAD)', type: 'number' },
    { key: 'prev', label: 'Loyer prévisionnel (MAD)', type: 'number' },
    {
      key: 'locataireId',
      label: 'Locataire',
      full: true,
      options: [
        { value: '', label: 'Aucun · Bien disponible' },
        ...data.locataires
          .filter((l) => !l.bienId || l.bienId === editor?.id)
          .map((l) => ({ value: l.id, label: l.name })),
      ],
      help: 'Le bien et le locataire seront associés ensemble.',
    },
  ];
  return (
    <div className="page-stack">
      <div className="stats-grid stats-three">
        <Stat
          label="Biens immobiliers"
          value={properties.length}
          detail={`${occupied} occupé${occupied > 1 ? 's' : ''} · ${properties.length - occupied} disponible${properties.length - occupied > 1 ? 's' : ''}`}
          icon="building"
          tone="violet"
        />
        <Stat
          label="Loyers actuels / mois"
          value={<Money value={sum(properties, 'loyer')} />}
          detail="Somme des loyers renseignés"
          icon="wallet"
          tone="mint"
        />
        <Stat
          label="Potentiel / mois"
          value={<Money value={sum(properties, 'prev')} />}
          detail="Prévisions renseignées"
          icon="trend"
          tone="amber"
        />
      </div>
      <section className="panel">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">VOTRE PATRIMOINE</span>
            <h2>Les biens, simplement.</h2>
          </div>
          {!readOnly && (
            <Button icon="plus" onClick={() => setEditor(blank())}>
              Nouveau bien
            </Button>
          )}
        </div>
        <div className="filter-toolbar">
          <div className="search-field">
            <Icon name="search" />
            <Field
              label="Rechercher un bien"
              value={query}
              onChange={setQuery}
              placeholder="Nom, type…"
            />
          </div>
          <Field
            label="Occupation"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Tous les biens' },
              { value: 'occupied', label: 'Biens occupés' },
              { value: 'available', label: 'Biens disponibles' },
            ]}
          />
        </div>
      </section>
      {list.length ? (
        <div className="property-grid">
          {list.map((b) => {
            const tenant = data.locataires.find((l) => l.id === b.locataireId);
            return (
              <article className="property-item" key={b.id}>
                <div className="property-visual">
                  <span className="property-drawing">
                    <Icon name="building" size={58} />
                  </span>
                  <Badge tone={tenant ? 'mint' : 'amber'}>{tenant ? 'Occupé' : 'Disponible'}</Badge>
                  <span className="property-type">{b.type?.split('/')[0]}</span>
                </div>
                <div className="property-body">
                  <h2>{b.nom}</h2>
                  <p className="property-tenant">
                    <Icon name="users" size={16} />
                    {tenant ? tenant.name : 'Prêt à accueillir un locataire'}
                  </p>
                  <div className="property-details">
                    <div>
                      <span>{b.loyer ? 'Loyer mensuel' : 'Loyer prévisionnel'}</span>
                      <Money value={b.loyer || b.prev} />
                    </div>
                    <div>
                      <span>Surface</span>
                      <strong>{b.surf ? `${b.surf} m²` : 'Non renseignée'}</strong>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="property-actions">
                      <Button
                        small
                        variant="secondary"
                        icon="edit"
                        onClick={() => setEditor({ ...b, locataireId: b.locataireId ?? '' })}
                      >
                        Modifier
                      </Button>
                      <button
                        className="icon-button action-danger"
                        aria-label={`Supprimer ${b.nom}`}
                        onClick={() => setDeletion(b)}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title="Aucun bien à afficher"
            description={
              properties.length
                ? 'Modifiez la recherche ou le filtre.'
                : 'Ajoutez votre premier bien pour organiser votre patrimoine.'
            }
            icon="building"
            action={
              !readOnly && (
                <Button icon="plus" onClick={() => setEditor(blank())}>
                  Ajouter un bien
                </Button>
              )
            }
          />
        </section>
      )}
      <Modal
        show={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Modifier le bien' : 'Nouveau bien'}
      >
        {editor && (
          <RecordForm
            key={editor.id || 'new'}
            initial={editor}
            fields={fields}
            onCancel={() => setEditor(null)}
            onSubmit={async (form) => {
              await mutate((snapshot) => saveProperty(snapshot, form));
              setEditor(null);
            }}
          />
        )}
      </Modal>
      <ConfirmDelete
        show={!!deletion}
        description={`Supprimer « ${deletion?.nom || ''} » ? Le locataire associé sera conservé et détaché de ce bien.`}
        onClose={() => setDeletion(null)}
        onConfirm={() => mutate((snapshot) => removeProperty(snapshot, deletion.id))}
      />
    </div>
  );
}

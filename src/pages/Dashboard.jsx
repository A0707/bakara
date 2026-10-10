import React from 'react';
import { Button, Stat, Money, Badge, PanelHeader, EmptyState } from '../components/UI';
import Icon from '../components/Icon';
import { cashMetrics, rentMetrics, categoryTotals } from '../lib/metrics';
const colors = ['#5263dc', '#9b74d6', '#40a487', '#edaa48', '#d56488', '#569cc0', '#9e927c'];
export default function Dashboard({ data, navigate, readOnly }) {
  const { income, expenses, balance } = cashMetrics(data);
  const known = balance !== null;
  const rents = rentMetrics(data.locataires),
    categories = categoryTotals(data.charges);
  const occupied = data.biens.filter((b) => b.locataireId != null).length;
  const recent = [...data.charges]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || Number(b.id) - Number(a.id))
    .slice(0, 5);
  const month = new Intl.DateTimeFormat('fr-MA', { month: 'long', year: 'numeric' }).format(
    new Date(),
  );
  const gradient = categories.length
    ? categories
        .map(({ amount }, i) => {
          const start = (categories.slice(0, i).reduce((s, c) => s + c.amount, 0) / expenses) * 100;
          return `${colors[i % colors.length]} ${start}% ${start + (amount / expenses) * 100}%`;
        })
        .join(',')
    : '#e8ecf6 0% 100%';
  return (
    <div className="page-stack">
      {!known && (
        <div className="notice" role="status">
          Le solde est indisponible : une partie de l’historique financier n’est pas présente dans
          cette source de données.
        </div>
      )}
      <div className="dashboard-hero-grid">
        <section className={`balance-card ${balance < 0 ? 'negative' : ''}`}>
          <div className="balance-top">
            <span>
              <i />
              CAISSE DISPONIBLE
            </span>
            <span className="balance-wallet">
              <Icon name="wallet" size={24} />
            </span>
          </div>
          <div className="balance-number">
            {known ? (
              <Money value={balance} />
            ) : (
              <span className="unavailable-value">Solde indisponible</span>
            )}
          </div>
          <p>
            {known
              ? 'Une vision claire de vos finances familiales.'
              : 'Complétez les sources avant de calculer le solde.'}
          </p>
          <div className="balance-footer">
            <span>
              <Icon name={!known ? 'clock' : balance >= 0 ? 'check' : 'down'} size={16} />
              {!known ? 'Source à compléter' : balance >= 0 ? 'Solde positif' : 'Solde déficitaire'}
            </span>
            <span>Cumul depuis le début du suivi</span>
          </div>
          <div className="balance-orbit" aria-hidden="true" />
        </section>
        <section className="quick-card">
          <div>
            <span className="eyebrow">ON AVANCE ENSEMBLE</span>
            <h2>Tout est à portée de main.</h2>
            <p>Enregistrez vos opérations et gardez votre suivi à jour.</p>
          </div>
          <div className="quick-actions">
            {!readOnly ? (
              <>
                <Button icon="plus" onClick={() => navigate('ch', 'new')}>
                  Nouvelle charge
                </Button>
                <Button icon="up" variant="secondary" onClick={() => navigate('al', 'new')}>
                  Nouvelle entrée
                </Button>
              </>
            ) : (
              <Button icon="wallet" variant="secondary" onClick={() => navigate('lo')}>
                Consulter les loyers
              </Button>
            )}
          </div>
        </section>
      </div>
      <div className="stats-grid stats-three">
        <Stat
          label="Entrées cumulées"
          value={
            income === null ? (
              <span className="unavailable-stat">Non disponible</span>
            ) : (
              <Money value={income} />
            )
          }
          detail={
            income === null
              ? 'Historique des entrées non disponible'
              : `${data.alim.length} source${data.alim.length > 1 ? 's' : ''} de financement`
          }
          icon="up"
          tone="mint"
        />
        <Stat
          label="Dépenses cumulées"
          value={
            expenses === null ? (
              <span className="unavailable-stat">Non disponible</span>
            ) : (
              <Money value={expenses} />
            )
          }
          detail={
            expenses === null
              ? 'Historique des charges non disponible'
              : `${data.charges.length} charge${data.charges.length > 1 ? 's' : ''} enregistrée${data.charges.length > 1 ? 's' : ''}`
          }
          icon="down"
          tone="rose"
        />
        <Stat
          label="Biens occupés"
          value={
            <>
              {occupied}
              <small> / {data.biens.length}</small>
            </>
          }
          detail={`${data.biens.length - occupied} disponible${data.biens.length - occupied > 1 ? 's' : ''} à la location`}
          icon="building"
          tone="violet"
        />
      </div>
      <div className="dashboard-middle">
        <section className="panel">
          <PanelHeader
            eyebrow="COMPRENDRE VOS DÉPENSES"
            title="Chaque dirham a sa place."
            action={<Badge>Cumul du suivi</Badge>}
          />
          {categories.length ? (
            <div className="category-content">
              <div
                className="donut"
                role="img"
                aria-label={`Dépenses réparties entre ${categories.length} catégories`}
                style={{ background: `conic-gradient(${gradient})` }}
              >
                <div>
                  <span>Dépenses</span>
                  <strong>
                    {new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(expenses)}
                  </strong>
                  <small>MAD</small>
                </div>
              </div>
              <div className="category-legend">
                {categories.map(({ category, amount }, i) => (
                  <div className="legend-row" key={category}>
                    <span>
                      <i style={{ background: colors[i % colors.length] }} />
                      {category}
                    </span>
                    <div>
                      <Money value={amount} currency={false} />
                      <small>{expenses ? Math.round((amount / expenses) * 100) : 0}%</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Vos dépenses apparaîtront ici"
              description="La répartition se construit à chaque charge enregistrée."
              icon="down"
            />
          )}
        </section>
        <section className="panel rent-summary">
          <PanelHeader
            eyebrow="LE SUIVI DU MOIS"
            title="Vos loyers"
            action={
              <span className="stat-icon tone-violet">
                <Icon name="building" />
              </span>
            }
          />
          <div className="rent-summary-body">
            <span className="month-label">{month}</span>
            <strong>
              <Money value={rents.received} />
            </strong>
            <p>encaissés ce mois</p>
            <div className="progress-label">
              <span>
                {rents.paid.length} / {data.locataires.length} réglés
              </span>
              <strong>{rents.pct}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: rents.pct + '%' }} />
            </div>
            <div className="due-summary">
              <span>Reste à recevoir</span>
              <Money value={rents.due} />
            </div>
            <Button variant="secondary" icon="arrow" onClick={() => navigate('lo')}>
              Voir les loyers
            </Button>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel recent-panel">
          <PanelHeader
            eyebrow="AU FIL DE VOS FINANCES"
            title="Dernières charges"
            action={
              <Button small variant="ghost" onClick={() => navigate('ch')}>
                Tout voir
                <Icon name="arrow" size={16} />
              </Button>
            }
          />
          {recent.length ? (
            <div className="recent-list">
              {recent.map((row) => (
                <div className="recent-row" key={row.id}>
                  <span className="transaction-symbol tone-rose">
                    <Icon name="down" />
                  </span>
                  <div>
                    <strong>{row.d}</strong>
                    <span>
                      {row.c} · {row.date || row.p || 'Date non renseignée'}
                    </span>
                  </div>
                  <Money value={row.m} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune charge pour le moment"
              description="Votre historique apparaîtra ici."
              icon="clock"
            />
          )}
        </section>
        <section className="patrimony-card">
          <span className="patrimony-icon">
            <Icon name="building" size={32} />
          </span>
          <span className="eyebrow">VOTRE PATRIMOINE</span>
          <h2>Un espace pour chaque projet.</h2>
          <p>Retrouvez vos biens, leurs loyers et leurs locataires.</p>
          <div className="patrimony-count">
            <strong>{data.biens.length}</strong>
            <span>
              biens immobiliers
              <br />
              <b>
                {occupied} occupé{occupied > 1 ? 's' : ''}
              </b>
            </span>
          </div>
          <Button variant="secondary" icon="arrow" onClick={() => navigate('bi')}>
            Explorer les biens
          </Button>
        </section>
      </div>
    </div>
  );
}

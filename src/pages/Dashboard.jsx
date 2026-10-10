import React from 'react';
import Icon from '../components/Icon';
import { fmt, CAT_C } from '../lib/data';
import { sum, rentMetrics, categoryTotals } from '../lib/metrics';
export default function Dashboard({ data, navigate }) {
  const { charges, alim, biens, locataires } = data;
  const income = sum(alim),
    expenses = sum(charges),
    balance = income - expenses;
  const rents = rentMetrics(locataires),
    categories = categoryTotals(charges);
  const occupied = biens.filter((b) => b.locataireId).length;
  const recent = [...charges]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
    .slice(0, 5);
  const month = new Intl.DateTimeFormat('fr-MA', { month: 'long', year: 'numeric' }).format(
    new Date(),
  );
  return (
    <>
      <div className="overview-grid">
        <section className={`balance-card ${balance < 0 ? 'negative' : ''}`}>
          <div className="balance-top">
            <span>
              <span className="light-dot" />
              CAISSE DISPONIBLE
            </span>
            <Icon name="wallet" size={24} />
          </div>
          <div className="balance-number">
            {fmt(balance)}
            <span>MAD</span>
          </div>
          <p>Le solde de vos entrées et de vos dépenses</p>
          <div className="balance-bottom">
            <span>
              <Icon name={balance >= 0 ? 'check' : 'down'} size={15} />
              {balance >= 0 ? 'Solde positif' : 'Solde déficitaire'}
            </span>
            <span>Depuis le début du suivi</span>
          </div>
          <svg className="balance-art" viewBox="0 0 220 180" aria-hidden="true">
            <circle cx="165" cy="170" r="110" />
            <circle cx="165" cy="170" r="78" />
            <circle cx="165" cy="170" r="46" />
          </svg>
        </section>
        <section className="metric-card">
          <span className="metric-icon green">
            <Icon name="up" />
          </span>
          <span className="metric-label">Total des entrées</span>
          <strong>
            {fmt(income)}
            <small>MAD</small>
          </strong>
          <p>
            {alim.length} source{alim.length !== 1 ? 's' : ''} de financement
          </p>
          <button className="text-button" onClick={() => navigate('al')}>
            Voir les entrées
            <Icon name="arrow" size={16} />
          </button>
        </section>
        <section className="metric-card">
          <span className="metric-icon orange">
            <Icon name="down" />
          </span>
          <span className="metric-label">Total des dépenses</span>
          <strong>
            {fmt(expenses)}
            <small>MAD</small>
          </strong>
          <p>
            {charges.length} charge{charges.length !== 1 ? 's' : ''} enregistrée
            {charges.length !== 1 ? 's' : ''}
          </p>
          <button className="text-button" onClick={() => navigate('ch')}>
            Voir les charges
            <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>
      <div className="dashboard-middle">
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MIEUX COMPRENDRE</span>
              <h2>Où vont vos dépenses ?</h2>
            </div>
            <span className="muted-label">Cumul du suivi</span>
          </div>
          {categories.length ? (
            <div className="category-content">
              <div className="donut-wrap">
                <div
                  className="donut"
                  role="img"
                  aria-label={`Répartition de ${fmt(expenses)} MAD de dépenses`}
                  style={{
                    background: `conic-gradient(${(() => {
                      let start = 0;
                      return categories
                        .map(({ category, amount }) => {
                          const end = start + (expenses ? (amount / expenses) * 100 : 0);
                          const result = `${CAT_C[category] || '#94a3b8'} ${start}% ${end}%`;
                          start = end;
                          return result;
                        })
                        .join(',');
                    })()})`,
                  }}
                >
                  <div>
                    <span>Total dépenses</span>
                    <strong>
                      {new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(
                        expenses,
                      )}
                    </strong>
                    <small>MAD</small>
                  </div>
                </div>
                <span className="chart-caption">{categories.length} catégories de dépenses</span>
              </div>
              <div className="category-legend">
                {categories.map(({ category, amount }) => (
                  <div className="legend-row" key={category}>
                    <span className="legend-name">
                      <i style={{ background: CAT_C[category] || '#94a3b8' }} />
                      {category}
                    </span>
                    <span>
                      <strong>{fmt(amount)}</strong>
                      <small>{expenses ? Math.round((amount / expenses) * 100) : 0}%</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">Vos premières dépenses apparaîtront ici.</div>
          )}
        </section>
        <section className="panel rent-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">VOTRE IMMOBILIER</span>
              <h2>Loyers du mois</h2>
            </div>
            <span className="metric-icon lavender">
              <Icon name="building" />
            </span>
          </div>
          <span className="month-label">{month}</span>
          <div className="rent-amount">
            {fmt(rents.received)} <small>MAD encaissés</small>
          </div>
          <div className="progress-label">
            <span>
              {rents.paid.length} / {locataires.length} loyers réglés
            </span>
            <strong>{rents.pct}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: rents.pct + '%' }} />
          </div>
          <div className="rent-due">
            <span>Reste à recevoir</span>
            <strong>
              {fmt(rents.due)} <small>MAD</small>
            </strong>
          </div>
          <button className="button button-outline rent-button" onClick={() => navigate('lo')}>
            Gérer les loyers
            <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LE FIL DE VOS FINANCES</span>
              <h2>Dernières charges</h2>
            </div>
            <button className="text-button" onClick={() => navigate('ch')}>
              Tout voir
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="recent-list">
            {recent.map((x) => (
              <div className="recent-row" key={x.id}>
                <span
                  className="transaction-icon"
                  style={{
                    color: CAT_C[x.c] || '#64748b',
                    background: (CAT_C[x.c] || '#64748b') + '12',
                  }}
                >
                  <Icon name="down" size={18} />
                </span>
                <div className="recent-description">
                  <strong>{x.d}</strong>
                  <span>
                    {x.c} ·{' '}
                    {x.date
                      ? new Intl.DateTimeFormat('fr-MA').format(new Date(x.date + 'T12:00:00'))
                      : x.p || 'Date non renseignée'}
                  </span>
                </div>
                <strong className="recent-amount">
                  − {fmt(x.m)}
                  <small>MAD</small>
                </strong>
              </div>
            ))}
            {!recent.length && <div className="empty-state">Aucune charge enregistrée.</div>}
          </div>
        </section>
        <section className="property-card">
          <span className="property-icon">
            <Icon name="building" size={28} />
          </span>
          <span className="eyebrow">VOTRE PATRIMOINE</span>
          <h2>Un regard sur vos biens.</h2>
          <div className="property-counts">
            <div>
              <strong>{biens.length}</strong>
              <span>biens au total</span>
            </div>
            <div>
              <strong>
                {occupied}
                <small>/{biens.length}</small>
              </strong>
              <span>biens occupés</span>
            </div>
          </div>
          <div className="property-divider" />
          <p>
            {biens.length - occupied} bien{biens.length - occupied !== 1 ? 's' : ''} disponible
            {biens.length - occupied !== 1 ? 's' : ''} à la location
          </p>
          <button className="text-button" onClick={() => navigate('bi')}>
            Explorer le patrimoine
            <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

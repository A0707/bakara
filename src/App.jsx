import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFinance } from './hooks/useFinance';
import { usePwa } from './hooks/usePwa';
import PwaInstall, { OfflineNotice } from './components/PwaInstall';
import { supabase } from './lib/supabase';
import Icon from './components/Icon';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Charges from './pages/Charges';
import Alim from './pages/Alim';
import Biens from './pages/Biens';
import Loyers from './pages/Loyers';
const tabs = [
  {
    key: 'dash',
    label: 'Vue d’ensemble',
    icon: 'grid',
    title: 'Votre patrimoine, en un regard.',
    description: 'Tout ce qui compte pour vos finances, au même endroit.',
  },
  {
    key: 'ch',
    label: 'Charges',
    icon: 'down',
    title: 'Gardez le cap sur vos dépenses.',
    description: 'Retrouvez, filtrez et gérez toutes vos charges.',
  },
  {
    key: 'al',
    label: 'Entrées de caisse',
    icon: 'up',
    title: 'Chaque entrée compte.',
    description: 'Suivez les sources de financement de votre caisse.',
  },
  {
    key: 'lo',
    label: 'Loyers & locataires',
    icon: 'wallet',
    title: 'Des loyers suivis, l’esprit tranquille.',
    description: 'Paiements, historique et locataires : une vision claire chaque mois.',
  },
  {
    key: 'bi',
    label: 'Biens immobiliers',
    icon: 'building',
    title: 'Votre patrimoine prend forme.',
    description: 'Organisez vos biens et suivez leur occupation.',
  },
];
export default function App() {
  const pwa = usePwa();
  const auth = useAuth();
  const finance = useFinance(
    auth.ready && (!supabase || !!auth.session),
    auth.session?.user.id || 'local',
  );
  const [tab, setTab] = useState('dash'),
    [menu, setMenu] = useState(false);
  const current = tabs.find((t) => t.key === tab);
  const navigate = (key) => {
    setTab(key);
    setMenu(false);
    window.scrollTo({ top: 0 });
  };
  const props = (key) => ({
    data: finance.data[key],
    setData: (d) => finance.update(key, d),
    save: (d) => finance.save(key, d),
    ro: auth.readOnly || finance.status === 'error' || (!!supabase && !pwa.online),
  });
  async function logout() {
    if (!confirm('Se déconnecter de Bakara ?')) return;
    const { error } = await supabase.auth.signOut();
    if (error) alert('La déconnexion a échoué. Réessayez.');
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 2, exportedAt: new Date().toISOString(), ...finance.data },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakara-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!auth.ready)
    return (
      <div className="loading-screen">
        <span className="brand-mark">b.</span>
        <p>Ouverture de votre espace…</p>
      </div>
    );
  if (supabase && !auth.session) return <Login pwa={pwa} />;
  const date = new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const role = auth.readOnly ? 'Lecture seule' : supabase ? 'Gestionnaire' : 'Mode local';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('dash');
          }}
        >
          <span className="brand-mark">
            b<span>.</span>
          </span>
          <span>
            bakara<span className="brand-subtitle">FINANCES & PATRIMOINE</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">B</span>
          <div>
            Espace familial<small>Gestion du patrimoine</small>
          </div>
          <Icon name="chevron" size={15} />
        </div>
        <span className="nav-caption">VOTRE ESPACE</span>
        <nav aria-label="Navigation principale">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${tab === t.key ? 'active' : ''}`}
              aria-current={tab === t.key ? 'page' : undefined}
              onClick={() => navigate(t.key)}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
              {tab === t.key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="shield" size={22} />
          <h3>Une vision partagée.</h3>
          <p>Des finances organisées pour avancer ensemble.</p>
        </div>
        <div className="sidebar-account">
          <span className="account-avatar">
            {auth.session?.user.email?.[0]?.toUpperCase() || 'B'}
          </span>
          <div>
            <strong>{auth.session?.user.email?.split('@')[0] || 'Espace Bakara'}</strong>
            <small>{role}</small>
          </div>
          {auth.session && (
            <button className="icon-button" onClick={logout} aria-label="Se déconnecter">
              <Icon name="logout" size={18} />
            </button>
          )}
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Ouvrir le menu"
              aria-expanded={menu}
            >
              <Icon name="menu" />
            </button>
            <span>Espace familial</span>
            <Icon name="chevron" size={14} />
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="connection-state">
              <i />
              {!supabase
                ? 'Stockage local'
                : finance.status === 'saving'
                  ? 'Enregistrement…'
                  : finance.status === 'saved'
                    ? 'Enregistré'
                    : finance.status === 'error'
                      ? 'Échec de sauvegarde'
                      : 'Espace connecté'}
            </span>
            <span className="topbar-avatar">B</span>
          </div>
        </header>
        <main id="main" className="main-content">
          {!pwa.online && !!supabase && <OfflineNotice />}
          {!pwa.installed && (
            <div className="pwa-entry">
              <div>
                <strong>Bakara sur votre téléphone</strong>
                <span>Ajoutez votre espace à l’écran d’accueil.</span>
              </div>
              <PwaInstall pwa={pwa} />
            </div>
          )}
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {tab === 'dash' ? 'BIENVENUE CHEZ BAKARA' : current.label.toUpperCase()}
              </span>
              <h1>{current.title}</h1>
              <p>{current.description}</p>
            </div>
            <div className="page-actions">
              <span className="date-chip">
                <Icon name="calendar" size={16} />
                {date}
              </span>
              <button
                className="button button-outline export-button"
                onClick={exportData}
                disabled={finance.loading || !!finance.error}
              >
                <Icon name="download" size={16} />
                Exporter
              </button>
            </div>
          </div>
          {!supabase && (
            <div className="notice">Mode local : les données restent dans ce navigateur.</div>
          )}
          {finance.status === 'error' && (
            <div className="notice error" role="alert">
              La modification n’a pas été sauvegardée. L’édition est suspendue.{' '}
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Recharger les données enregistrées et abandonner les modifications non sauvegardées ?',
                    )
                  )
                    finance.retry();
                }}
              >
                Recharger les données enregistrées
              </button>
            </div>
          )}
          {auth.readOnly && (
            <div className="notice">
              <Icon name="eye" size={16} />
              Vous consultez cet espace en lecture seule.
            </div>
          )}
          {finance.loading ? (
            <div className="loading-panel">
              <div className="skeleton" />
              <div className="skeleton" />
              <p>Chargement de vos données…</p>
            </div>
          ) : finance.error ? (
            <div className="panel error-panel" role="alert">
              <Icon name="wallet" size={36} />
              <h2>Retrouvons vos données.</h2>
              <p>{finance.error}</p>
              <button className="button" onClick={finance.retry}>
                Réessayer
              </button>
            </div>
          ) : (
            <div className={tab === 'dash' ? 'dashboard' : 'legacy-page'} key={tab}>
              {tab === 'dash' && <Dashboard data={finance.data} navigate={navigate} />}{' '}
              {tab === 'ch' && <Charges {...props('charges')} />}{' '}
              {tab === 'al' && <Alim {...props('alim')} />}{' '}
              {tab === 'lo' && (
                <Loyers
                  {...props('locataires')}
                  biens={finance.data.biens}
                  setBiens={(d) => finance.update('biens', d)}
                  saveBiens={(d) => finance.save('biens', d)}
                />
              )}{' '}
              {tab === 'bi' && (
                <Biens
                  {...props('biens')}
                  locs={finance.data.locataires}
                  setLocs={(d) => finance.update('locataires', d)}
                  saveLocs={(d) => finance.save('locataires', d)}
                />
              )}
            </div>
          )}
          <footer className="app-footer">
            <span>Bakara · Finances & patrimoine</span>
            <span>Les montants sont exprimés en dirhams marocains (MAD).</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

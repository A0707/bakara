import React, { useEffect, useRef, useState } from 'react';
import { NAVIGATION } from '../lib/navigation';
import Icon from './Icon';
import PwaInstall from './PwaInstall';
import { Button, Badge, Modal } from './UI';
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        B<span />
      </span>
      <div>
        bakara<span>Finances & patrimoine</span>
      </div>
    </div>
  );
}
export default function Shell({
  route,
  navigate,
  pwa,
  session,
  readOnly,
  status,
  exportData,
  logout,
  busy,
  children,
}) {
  const current = NAVIGATION.find((item) => item.key === route.key),
    heading = useRef(null),
    [options, setOptions] = useState(false);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [route.key]);
  const name = session?.user.email?.split('@')[0] || 'Espace familial';
  const state =
    status === 'saving'
      ? 'Enregistrement…'
      : status === 'saved'
        ? 'Enregistré'
        : status === 'error'
          ? 'Échec de sauvegarde'
          : pwa.online
            ? 'Espace connecté'
            : 'Hors connexion';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <aside className="sidebar">
        <a
          href="#dash"
          className="brand-link"
          onClick={(event) => {
            event.preventDefault();
            navigate('dash');
          }}
          aria-label="Bakara, accueil"
        >
          <Brand />
        </a>
        <div className="workspace-label">
          <span className="workspace-symbol">
            <Icon name="users" size={20} />
          </span>
          <div>
            Espace familial<small>Vos projets, ensemble.</small>
          </div>
        </div>
        <span className="nav-caption">VOTRE QUOTIDIEN</span>
        <nav aria-label="Navigation principale">
          {NAVIGATION.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${route.key === item.key ? 'active' : ''}`}
              aria-current={route.key === item.key ? 'page' : undefined}
              onClick={() => navigate(item.key)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {route.key === item.key && <Icon name="chevron" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-story">
          <span className="sidebar-story-icon">
            <Icon name="shield" size={24} />
          </span>
          <h3>
            Plus de clarté.
            <br />
            Plus de sérénité.
          </h3>
          <p>Un espace commun pour prendre soin de votre patrimoine.</p>
        </div>
        <div className="sidebar-install">
          <PwaInstall pwa={pwa} />
        </div>
        <button className="sidebar-account" onClick={() => setOptions(true)}>
          <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{name}</strong>
            <small>{readOnly ? 'Lecture seule' : 'Gestion familiale'}</small>
          </span>
          <Icon name="chevron" size={16} />
        </button>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-brand">
            <Brand />
          </div>
          <div className="topbar-location">
            <span>Espace familial</span>
            <Icon name="chevron" size={14} />
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`connection-state ${status === 'error' ? 'failed' : ''}`}
              role="status"
            >
              <i />
              {state}
            </span>
            <button
              className="account-button"
              aria-label="Compte et options"
              onClick={() => setOptions(true)}
            >
              <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                {route.key === 'dash' ? 'BIENVENUE DANS VOTRE ESPACE' : 'ESPACE FAMILIAL'}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {current.title}
              </h1>
              <p>{current.description}</p>
            </div>
            <span className="date-chip">
              <Icon name="calendar" size={18} />
              {new Intl.DateTimeFormat('fr-MA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </div>
          {children}
          <footer className="app-footer">
            <span>Fait pour votre famille. Pensé pour vos projets.</span>
            <span>Montants en dirhams marocains · MAD</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navigation mobile">
        {NAVIGATION.map((item) => (
          <button
            key={item.key}
            aria-label={item.label}
            aria-current={route.key === item.key ? 'page' : undefined}
            className={route.key === item.key ? 'active' : ''}
            onClick={() => navigate(item.key)}
          >
            <span>
              <Icon name={item.icon} size={22} />
            </span>
            {item.short}
          </button>
        ))}
      </nav>
      <Modal show={options} title="Votre espace Bakara" onClose={() => setOptions(false)}>
        <div className="account-detail">
          <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <p>{session?.user.email || 'Stockage dans ce navigateur'}</p>
          </div>
        </div>
        <Badge tone="violet">{readOnly ? 'Lecture seule' : 'Gestionnaire'}</Badge>
        <div className="account-options">
          <Button variant="secondary" icon="download" onClick={exportData} disabled={busy}>
            Exporter mes données
          </Button>
          <PwaInstall pwa={pwa} />
          {session && (
            <Button variant="ghost" icon="logout" onClick={logout} disabled={busy}>
              Se déconnecter
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}

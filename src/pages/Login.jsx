import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Field } from '../components/UI';
import { Brand } from '../components/Shell';
import Icon from '../components/Icon';
import PwaInstall, { OfflineNotice } from '../components/PwaInstall';
export default function Login({ pwa }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy || !pwa.online) return;
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch {
      setError('Connexion impossible. Vérifiez votre email et votre mot de passe.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <Brand />
        <div className="login-message">
          <span className="eyebrow">VOTRE FAMILLE. VOS PROJETS.</span>
          <h1>
            Finances en ordre.
            <br />
            <em>Projets en mouvement.</em>
          </h1>
          <p>Un espace partagé pour votre caisse, vos loyers et votre patrimoine. Simplement.</p>
          <div className="story-features">
            <div>
              <span>
                <Icon name="wallet" />
              </span>
              <strong>Des finances claires</strong>
              <p>Votre caisse et vos opérations réunies.</p>
            </div>
            <div>
              <span>
                <Icon name="building" />
              </span>
              <strong>Un patrimoine suivi</strong>
              <p>Vos biens et leurs locataires, en un regard.</p>
            </div>
          </div>
        </div>
        <span className="story-footer">
          <Icon name="shield" size={18} />
          Un espace commun pour avancer ensemble.
        </span>
        <div className="login-orbit" aria-hidden="true" />
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <span className="login-mobile-brand">
            <Brand />
          </span>
          <span className="eyebrow">HEUREUX DE VOUS RETROUVER</span>
          <h2>Bienvenue chez Bakara.</h2>
          <p>Connectez-vous à votre espace familial.</p>
          {!pwa.online && <OfflineNotice />}
          <Field
            label="Adresse email"
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="vous@exemple.com"
          />
          <Field
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={setPassword}
            placeholder="Votre mot de passe"
          />
          {error && (
            <div className="notice notice-error" role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="button button-primary login-submit"
            disabled={busy || !email.trim() || !password || !pwa.online}
          >
            {busy ? 'Connexion en cours…' : 'Se connecter'}
            <Icon name="arrow" />
          </button>
          <p className="login-help">
            Votre compte est créé par l’administrateur. Contactez-le si vous avez besoin d’aide.
          </p>
          <div className="login-install">
            <PwaInstall pwa={pwa} />
          </div>
        </form>
        <span className="login-footer">Bakara · Finances & patrimoine</span>
      </section>
    </main>
  );
}

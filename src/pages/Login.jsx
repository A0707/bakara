import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Inp } from '../components/UI';
import Icon from '../components/Icon';
export default function Login() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
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
        <a href="/" className="brand">
          <span className="brand-mark">
            b<span>.</span>
          </span>
          <span>
            bakara<span className="brand-subtitle">FINANCES & PATRIMOINE</span>
          </span>
        </a>
        <div className="login-message">
          <span className="eyebrow">UN PATRIMOINE, UNE VISION</span>
          <h1>
            Vos finances.
            <br />
            Votre famille.
            <br />
            <em>En harmonie.</em>
          </h1>
          <p>
            Un espace commun pour suivre votre caisse, vos dépenses et votre patrimoine immobilier.
          </p>
          <div className="story-tags">
            <span>
              <Icon name="wallet" />
              Finances
            </span>
            <span>
              <Icon name="building" />
              Patrimoine
            </span>
            <span>
              <Icon name="shield" />
              Sérénité
            </span>
          </div>
        </div>
        <span className="story-footer">Chaque détail compte. Chaque décision aussi.</span>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">VOTRE ESPACE BAKARA</span>
          <h2>Heureux de vous retrouver.</h2>
          <p>Connectez-vous pour retrouver votre vue d’ensemble.</p>
          <Inp l="Adresse email" v={email} onChange={setEmail} type="email" ph="vous@exemple.com" />
          <Inp
            l="Mot de passe"
            v={password}
            onChange={setPassword}
            type="password"
            ph="Votre mot de passe"
          />
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button className="button login-submit" disabled={busy || !email.trim() || !password}>
            {busy ? 'Connexion en cours…' : 'Se connecter'}
            <Icon name="arrow" />
          </button>
          <div className="login-help">
            <Icon name="shield" size={16} />
            <span>
              Votre compte est créé par l’administrateur.
              <br />
              Contactez-le si vous avez besoin d’aide.
            </span>
          </div>
        </form>
        <span className="login-footer">Bakara · Gestion financière familiale</span>
      </section>
    </main>
  );
}

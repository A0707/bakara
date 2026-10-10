import React, { lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFinance } from './hooks/useFinance';
import { usePwa } from './hooks/usePwa';
import { useNavigation } from './hooks/useNavigation';
import { supabase } from './lib/supabase';
import Shell, { Brand } from './components/Shell';
import { OfflineNotice } from './components/PwaInstall';
import { Button, EmptyState } from './components/UI';
import Login from './pages/Login';
const pages = {
  dash: lazy(() => import('./pages/Dashboard')),
  ch: lazy(() => import('./pages/Charges')),
  al: lazy(() => import('./pages/Alim')),
  lo: lazy(() => import('./pages/Loyers')),
  bi: lazy(() => import('./pages/Biens')),
};
function Loading() {
  return (
    <div className="loading-panel" role="status">
      <div className="loading-shimmer" />
      <div className="loading-shimmer" />
      <p>Chargement de votre espace…</p>
    </div>
  );
}
export default function App() {
  const auth = useAuth(),
    pwa = usePwa(),
    { route, navigate } = useNavigation();
  const finance = useFinance(
    auth.ready && (!supabase || !!auth.session),
    auth.session?.user.id || 'local',
  );
  const readOnly = auth.readOnly || (!!supabase && !pwa.online);
  async function mutate(operation) {
    if (readOnly || finance.loading || finance.error)
      throw new Error('Cet espace est actuellement en lecture seule.');
    await finance.mutate(operation);
  }
  async function logout() {
    if (!confirm('Se déconnecter de Bakara ?')) return;
    const { error } = await supabase.auth.signOut();
    if (error) alert('La déconnexion a échoué. Réessayez.');
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 3, exportedAt: new Date().toISOString(), ...finance.data },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `bakara-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!auth.ready)
    return (
      <div className="loading-screen">
        <Brand />
        <p>Ouverture de votre espace…</p>
      </div>
    );
  if (supabase && !auth.session) return <Login pwa={pwa} />;
  const Page = pages[route.key];
  return (
    <Shell
      route={route}
      navigate={navigate}
      pwa={pwa}
      session={auth.session}
      readOnly={readOnly}
      status={finance.status}
      exportData={exportData}
      logout={logout}
      busy={finance.loading || !!finance.error || finance.status === 'saving'}
    >
      {!supabase && (
        <div className="notice">Mode local : les données restent dans ce navigateur.</div>
      )}
      {!pwa.online && !!supabase && <OfflineNotice />}
      {auth.readOnly && <div className="notice">Vous consultez cet espace en lecture seule.</div>}
      {finance.status === 'error' && (
        <div className="notice notice-error" role="status">
          La modification n’a pas été sauvegardée. Les données enregistrées restent inchangées ;
          vous pouvez réessayer.
        </div>
      )}
      {finance.loading ? (
        <Loading />
      ) : finance.error ? (
        <section className="panel">
          <EmptyState
            title="Retrouvons vos données."
            description={finance.error}
            icon="wallet"
            action={<Button onClick={finance.retry}>Réessayer</Button>}
          />
        </section>
      ) : (
        <Suspense fallback={<Loading />}>
          <Page
            key={`${route.key}/${route.action || ''}`}
            data={finance.data}
            mutate={mutate}
            readOnly={readOnly || finance.status === 'saving'}
            initialAction={readOnly ? undefined : route.action}
            navigate={navigate}
          />
        </Suspense>
      )}
    </Shell>
  );
}

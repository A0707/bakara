import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export function useAuth() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) {
        setSession(s);
        setReady(true);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setReady(true);
          if (error) setError('Impossible de vérifier votre connexion.');
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
          setError('Impossible de vérifier votre connexion.');
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const userId = session?.user.id;
  useEffect(() => {
    let active = true;
    setProfile(null);
    if (!userId || !supabase) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .abortSignal(AbortSignal.timeout(7000))
      .then(({ data }) => {
        if (active) setProfile(data || { id: userId, role: 'guest' });
      })
      .catch(() => {
        if (active) setProfile({ id: userId, role: 'guest' });
      });
    return () => {
      active = false;
    };
  }, [userId]);
  return {
    session,
    ready,
    profile,
    error,
    readOnly:
      !!supabase && (profile?.id !== userId || !['admin', 'family'].includes(profile?.role)),
  };
}

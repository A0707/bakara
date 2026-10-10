import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createFinanceRepository, emptySnapshot } from '../lib/financeRepository';
const repository = createFinanceRepository(supabase, window.localStorage);
export function useFinance(enabled, identity) {
  const [data, setData] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ready');
  const [revision, setRevision] = useState(0);
  const snapshot = useRef(data),
    generation = useRef(0),
    locked = useRef(false);
  useEffect(() => {
    const token = ++generation.current;
    setLoading(!!enabled);
    setError('');
    setStatus('ready');
    locked.current = false;
    snapshot.current = emptySnapshot();
    setData(snapshot.current);
    if (!enabled) return;
    (async () => {
      try {
        const fallback =
          import.meta.env.VITE_LOCAL_MODE === 'true'
            ? (await import('#seed-data')).default
            : emptySnapshot();
        const loaded = await repository.load(fallback);
        if (token === generation.current) {
          snapshot.current = loaded;
          setData(loaded);
        }
      } catch {
        if (token === generation.current)
          setError('Les données ne sont pas accessibles. Vérifiez votre connexion puis réessayez.');
      } finally {
        if (token === generation.current) setLoading(false);
      }
    })();
    return () => {
      generation.current++;
    };
  }, [enabled, identity, revision]);
  const mutate = useCallback(async (operation) => {
    if (locked.current) throw new Error('Un enregistrement est déjà en cours.');
    const patch = operation(snapshot.current);
    const token = generation.current;
    locked.current = true;
    setStatus('saving');
    try {
      await repository.save(patch);
      if (token === generation.current) {
        snapshot.current = { ...snapshot.current, ...patch };
        setData(snapshot.current);
        setStatus('saved');
      }
    } catch {
      if (token === generation.current) setStatus('error');
      throw new Error(
        'La modification n’a pas été sauvegardée. Vérifiez votre connexion puis réessayez.',
      );
    } finally {
      if (token === generation.current) locked.current = false;
    }
  }, []);
  return { data, loading, error, status, mutate, retry: () => setRevision((n) => n + 1) };
}

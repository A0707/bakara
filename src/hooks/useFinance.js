import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../lib/storage';
import { INIT_CHARGES, INIT_ALIM, INIT_BIENS, INIT_LOCS } from '../lib/data';
const defaults = {
  charges: INIT_CHARGES,
  alim: INIT_ALIM,
  biens: INIT_BIENS,
  locataires: INIT_LOCS,
};
const empty = { charges: [], alim: [], biens: [], locataires: [] };
export function useFinance(enabled, identity) {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ready');
  const [revision, reload] = useState(0);
  const queues = useRef({});
  const pending = useRef(0);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    generation.current++;
    pending.current = 0;
    queues.current = {};
    setData(empty);
    setError('');
    setStatus('ready');
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      Object.entries(defaults).map(async ([key, fallback]) => [
        key,
        await storage.get(key, fallback),
      ]),
    )
      .then((entries) => {
        if (active) setData(Object.fromEntries(entries));
      })
      .catch(() => {
        if (active)
          setError('Les données ne sont pas accessibles. Vérifiez votre connexion et réessayez.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, identity, revision]);
  const update = useCallback((key, value) => setData((d) => ({ ...d, [key]: value })), []);
  const save = useCallback((key, value) => {
    const token = generation.current;
    pending.current++;
    setStatus('saving');
    const previous = queues.current[key] || Promise.resolve();
    const request = previous
      .catch(() => {})
      .then(() => {
        if (token !== generation.current) return;
        return storage.set(key, value);
      });
    queues.current[key] = request;
    request
      .then(() => {
        if (token === generation.current && --pending.current === 0)
          setStatus((s) => (s === 'error' ? s : 'saved'));
      })
      .catch(() => {
        if (token === generation.current) {
          pending.current--;
          setStatus('error');
        }
      });
  }, []);
  return { data, update, save, loading, error, status, retry: () => reload((n) => n + 1) };
}

import { useEffect, useState, useCallback } from 'react';
import { NAVIGATION } from '../lib/navigation';
const parse = () => {
  const [key, action] = window.location.hash.slice(1).split('/');
  return {
    key: NAVIGATION.some((item) => item.key === key) ? key : 'dash',
    action: action === 'new' ? 'new' : undefined,
  };
};
export function useNavigation() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const change = () => setRoute(parse());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const navigate = useCallback((key, action) => {
    if (!NAVIGATION.some((item) => item.key === key)) return;
    window.location.hash = key + (action ? '/' + action : '');
    setRoute({ key, action });
    window.scrollTo({ top: 0 });
  }, []);
  return { route, navigate };
}

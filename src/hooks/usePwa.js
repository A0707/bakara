import { useEffect, useState } from 'react';

export function usePwa() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const updateNetwork = () => setOnline(navigator.onLine);
    const updateDisplay = () => setInstalled(media.matches || navigator.standalone === true);
    const available = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    media.addEventListener('change', updateDisplay);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
      media.removeEventListener('change', updateDisplay);
    };
  }, []);

  async function install() {
    if (!prompt || busy) return false;
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return true;
    } catch {
      return false;
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }
  return { online, installed, busy, install, canPrompt: !!prompt };
}

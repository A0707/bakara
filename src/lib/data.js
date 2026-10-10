const CATS = [
  'Avocat / Juridique',
  'Huissier',
  'Credits / Prets',
  'Travaux / Maison',
  'Figuig / Agriculture',
  'Medical',
  'Transport',
  'Divers',
];
const CAT_C = {
  'Avocat / Juridique': '#3b82f6',
  Huissier: '#f59e0b',
  'Credits / Prets': '#ef4444',
  'Travaux / Maison': '#22c55e',
  'Figuig / Agriculture': '#eab308',
  Medical: '#a855f7',
  Transport: '#64748b',
  Divers: '#94a3b8',
};
const MOIS = [
  'Jan',
  'Fev',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aout',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ── PROPRIETAIRES ──
const OWNERS = {
  hajar: { name: 'Hajar ELJAMILI', pct: 0.75 },
  malika: { name: 'Malika Azziouaz', pct: 0.25 },
};
const MOIS12 = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];
const MOIS_C = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];
const PAY_MODES = [
  { k: 'espece', l: 'Espèce', c: '#f59e0b', ic: '💵' },
  { k: 'cheque', l: 'Chèque', c: '#16a34a', ic: '🧾' },
  { k: 'virement', l: 'Virement', c: '#3b82f6', ic: '🏦' },
];
const modeMeta = (k) => PAY_MODES.find((m) => m.k === k) || { k, l: k, c: '#64748b', ic: '•' };

// Helpers mkLaam/mkTirm supprimes - tabs Laamiri/Tirmidi enleves

const fmt = (n) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n || 0,
  );
const fmtK = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : n.toFixed(0);
export { CATS, CAT_C, MOIS, OWNERS, MOIS12, MOIS_C, PAY_MODES, modeMeta, fmt, fmtK };

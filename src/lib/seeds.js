const INIT_CHARGES = [
  { id: 1, d: 'Avance avocat Mahassine', c: 'Avocat / Juridique', p: '2023', m: 1500, n: '' },
  { id: 2, d: 'Avocat Saida Beloutt', c: 'Avocat / Juridique', p: '2023', m: 20000, n: '' },
  { id: 3, d: 'Credit Mustapha', c: 'Credits / Prets', p: '2024', m: 290000, n: '150K+140K' },
  { id: 4, d: 'Operation Malika', c: 'Medical', p: '2023', m: 20000, n: '' },
  { id: 5, d: 'Aid Kbir 2023', c: 'Divers', p: '2023', m: 5000, n: '' },
  { id: 6, d: 'Credit Hajar', c: 'Credits / Prets', p: 'Mars 2024', m: 5000, n: '' },
  { id: 7, d: 'Aid Kbir 2024', c: 'Divers', p: '2024', m: 2500, n: '' },
  { id: 8, d: 'Credit Hajar', c: 'Credits / Prets', p: 'Oct 2024', m: 10000, n: '' },
  { id: 9, d: 'Huissier Ifragh', c: 'Huissier', p: '2025', m: 2500, n: '' },
  { id: 10, d: 'Soudeur', c: 'Travaux / Maison', p: '2025', m: 300, n: '' },
  { id: 11, d: 'Fourniture', c: 'Travaux / Maison', p: '2025', m: 370, n: '' },
  { id: 12, d: 'Date Figuig', c: 'Figuig / Agriculture', p: '2024', m: 900, n: '' },
  { id: 13, d: 'Serrurier', c: 'Travaux / Maison', p: '2025', m: 600, n: '' },
  { id: 14, d: 'Frais Avocat Mahassine', c: 'Avocat / Juridique', p: '2025', m: 500, n: '' },
  { id: 15, d: 'Frais Avocat Beloutt', c: 'Avocat / Juridique', p: '2025', m: 15000, n: '' },
  { id: 16, d: 'Avocat Mahassine cheque NP', c: 'Avocat / Juridique', p: '2025', m: 2300, n: '' },
  {
    id: 17,
    d: 'Avocat Mahassine Ifragh Tirmidi',
    c: 'Avocat / Juridique',
    p: '2025',
    m: 2000,
    n: '',
  },
  { id: 18, d: 'Frais Encaissement 2x cheque', c: 'Divers', p: '2025', m: 83.6, n: '' },
  { id: 19, d: 'Frais plantation Figuig', c: 'Figuig / Agriculture', p: '2025', m: 1024, n: '' },
  { id: 20, d: 'Peinture HAJAA', c: 'Travaux / Maison', p: '2025', m: 10000, n: '' },
  { id: 21, d: 'Police TIRMIDI', c: 'Avocat / Juridique', p: '2025', m: 2500, n: '' },
  { id: 22, d: 'Refrigerateur HAJAA', c: 'Travaux / Maison', p: '2025', m: 7500, n: '' },
  { id: 23, d: 'Bureau du greffier', c: 'Avocat / Juridique', p: '2025', m: 500, n: '' },
  { id: 24, d: 'Charge supplementaire', c: 'Divers', p: '2025', m: 200, n: '' },
  { id: 25, d: 'Frais avocat MAHASSINE', c: 'Avocat / Juridique', p: '2025', m: 2500, n: '' },
  { id: 26, d: 'Frais avocat MAHASSINE', c: 'Avocat / Juridique', p: '2025', m: 3000, n: '' },
  { id: 27, d: 'Credit HAJAR', c: 'Credits / Prets', p: '2025', m: 5000, n: '' },
  { id: 28, d: 'Fourniture Plomberie', c: 'Travaux / Maison', p: '2025', m: 1327, n: '' },
  { id: 29, d: 'Location meuleuse', c: 'Travaux / Maison', p: '2025', m: 50, n: '' },
  { id: 30, d: "Main d'oeuvre Plomberie", c: 'Travaux / Maison', p: '2025', m: 2000, n: '' },
  { id: 31, d: 'Chauffe-eau', c: 'Travaux / Maison', p: '2025', m: 1650, n: '' },
  { id: 32, d: 'Marbre', c: 'Travaux / Maison', p: '2025', m: 1000, n: '' },
  { id: 33, d: "Main d'oeuvre", c: 'Travaux / Maison', p: '2025', m: 1300, n: '' },
  { id: 34, d: '2 plombiers', c: 'Travaux / Maison', p: '2025', m: 250, n: '' },
  { id: 35, d: 'Frais Medecin HAJJA', c: 'Medical', p: '2025', m: 3500, n: '' },
  {
    id: 36,
    d: 'Frais Avocat Mahassine HOUMAN',
    c: 'Avocat / Juridique',
    p: '2025',
    m: 1500,
    n: '',
  },
  { id: 37, d: 'Reste credit Hajar', c: 'Credits / Prets', p: '2025', m: 1500, n: '' },
  { id: 38, d: 'Date Figuig', c: 'Figuig / Agriculture', p: '2025', m: 1466, n: '' },
  { id: 39, d: 'Charge non identifiee', c: 'Divers', p: '2025', m: 2500, n: 'Verifier' },
  { id: 40, d: 'Huissier Ifragh + Charge', c: 'Huissier', p: '2026', m: 2868, n: '' },
  { id: 41, d: 'Aid Kebir 2026', c: 'Divers', p: '2026', m: 6000, n: '' },
  { id: 42, d: 'Taxe Habitation', c: 'Divers', p: '2026', m: 9000, n: '' },
];

const INIT_ALIM = [
  { id: 1, s: 'Rachid Laamiri (cumul)', m: 375000, t: 'Echeance', p: '2023-2024' },
  { id: 2, s: 'Abderazzak Tirmidi (cumul)', m: 90000, t: 'Echeance', p: '2024-2025' },
  { id: 3, s: 'Cheque HOUMAN 2025', m: 18120, t: 'Cheque', p: '2025' },
  { id: 4, s: 'Cheque HOUMAN 2026', m: 15660, t: 'Cheque', p: '2026' },
];

// ── BIENS IMMOBILIERS (PDF) ──
// a=loyer actuel, p=loyer previsionnel, s=surface, l=loue, sr=sarout
const _BIENS_RAW = [
  { t: 'Magasin', a: 275, p: 275, s: 24, l: true, sr: 250000 },
  { t: 'Magasin', a: 605, p: 605, s: 15, l: true, sr: 140000 },
  { t: 'Magasin', a: 0, p: 4000, s: 18, l: false, sr: 70000 },
  { t: 'Magasin', a: 0, p: 11000, s: 19, l: false, sr: 70000 },
  { t: 'Magasin', a: 0, p: 25000, s: 147, l: false, sr: 250000 },
  { t: 'Magasin', a: 0, p: 25000, s: 140, l: false, sr: 0 },
  { t: 'Appartement', a: 2160, p: 2160, s: 165, l: true, sr: 100000 },
  { t: 'Appartement', a: 0, p: 3000, s: 66, l: false, sr: 0 },
  { t: 'Studio', a: 709, p: 709, s: 17, l: true, sr: 70000 },
  { t: 'Appartement', a: 880, p: 880, s: 47, l: true, sr: 100000 },
  { t: 'Appartement', a: 634, p: 634, s: 61, l: true, sr: 100000 },
  { t: 'Appartement', a: 864, p: 864, s: 72, l: true, sr: 100000 },
  { t: 'Appartement/Bidonville', a: 792, p: 792, s: 0, l: true, sr: 70000 },
  { t: 'Appartement/Bidonville', a: 1115, p: 1115, s: 0, l: true, sr: 70000 },
  { t: 'Appartement/Bidonville', a: 850, p: 850, s: 0, l: true, sr: 70000 },
  { t: 'Appartement/Bidonville', a: 800, p: 800, s: 0, l: true, sr: 70000 },
  { t: 'Appartement/Bidonville', a: 928, p: 928, s: 0, l: true, sr: 70000 },
];
const INIT_BIENS = _BIENS_RAW.map((b, i) => ({
  id: i + 1,
  num: i + 1,
  nom: b.t.split('/')[0] + ' n°' + (i + 1),
  type: b.t,
  loyer: b.a,
  prev: b.p,
  surf: b.s,
  loue: b.l,
  locataireId: null,
}));

// ── LOCATAIRES : pay = { "ANNEE-MOIS": {date, mode} } ──
const _CUR_YEAR = 2025; // année des données initiales
const _mkLoc = (id, name, rent, paidMonths, bienId) => {
  const pay = {};
  paidMonths.forEach((m) => {
    pay[_CUR_YEAR + '-' + m] = {
      date: _CUR_YEAR + '-' + String(m + 1).padStart(2, '0') + '-10',
      mode: 'espece',
    };
  });
  return { id, name, rent, pay, bienId: bienId || null };
};
const INIT_LOCS = [
  _mkLoc(1, 'Masalaska', 2160, [0, 1, 2, 3, 4, 5, 6, 7, 8], 7),
  _mkLoc(2, 'Mouhssin najat', 880, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10),
  _mkLoc(3, 'Houman', 830, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], null),
  _mkLoc(4, 'Kalakhi', 830, [0, 1, 2, 3, 4, 5, 6, 7, 8], null),
  _mkLoc(5, 'Oumaya', 1050, [0, 1, 2, 3, 4, 5, 6, 7, 8], null),
  _mkLoc(6, 'Tazit', 750, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], null),
  _mkLoc(7, 'Chanee', 670, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], null),
];
// Relier les biens correspondants (Masalaska→appart n°7, Mouhssin→appart n°10)
INIT_BIENS.forEach((b) => {
  const loc = INIT_LOCS.find((l) => l.bienId === b.id);
  if (loc) b.locataireId = loc.id;
});

export default { charges: INIT_CHARGES, alim: INIT_ALIM, biens: INIT_BIENS, locataires: INIT_LOCS };

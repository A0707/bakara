export function migrateData(key, d, fallback) {
  if (!d) return fallback;
  // Migration douce : anciennes données vers le nouveau modèle (liens + payé booléen)
  if (key === 'locataires')
    return d.map((l) => {
      if (l.pay) return { ...l, bienId: l.bienId !== undefined ? l.bienId : null }; // déjà au nouveau format
      // ancien format : months={mois:montant ou true} → pay={"2025-mois":{date,mode}}
      const pay = {};
      Object.keys(l.months || {}).forEach((k) => {
        if (l.months[k]) {
          const mi = +k;
          pay['2025-' + mi] = {
            date: '2025-' + String(mi + 1).padStart(2, '0') + '-10',
            mode: 'espece',
          };
        }
      });
      return { ...l, pay, months: undefined, bienId: l.bienId !== undefined ? l.bienId : null };
    });
  if (key === 'biens')
    return d.map((b) => ({
      ...b,
      locataireId: b.locataireId !== undefined ? b.locataireId : null,
    }));
  return d;
}

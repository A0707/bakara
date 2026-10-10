const number = (value) => Number(value) || 0;
export const dateToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const idFor = (rows) => Math.max(Date.now(), ...rows.map((row) => number(row.id) + 1));
const cleanAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error('Le montant doit être un nombre positif ou nul.');
  return Math.round(amount * 100) / 100;
};
const existingId = (rows, value) =>
  value === '' || value == null ? null : rows.find((row) => String(row.id) === String(value))?.id;
const required = (value, label) => {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} est obligatoire.`);
  return text;
};
const replaceRecord = (rows, record) => {
  if (record.id) {
    if (!rows.some((row) => row.id === record.id))
      throw new Error('Cet élément n’existe plus. Rechargez les données.');
    return rows.map((row) => (row.id === record.id ? { ...row, ...record } : row));
  }
  return [...rows, { ...record, id: idFor(rows) }];
};

export function saveLedger(snapshot, key, form) {
  if (!['charges', 'alim'].includes(key)) throw new Error('Collection inconnue.');
  const m = cleanAmount(form.m);
  if (m <= 0) throw new Error('Le montant doit être supérieur à zéro.');
  const record =
    key === 'charges'
      ? {
          ...form,
          d: required(form.d, 'La désignation'),
          c: required(form.c, 'La catégorie'),
          date: form.id && form.p && !form.date ? '' : required(form.date, 'La date'),
          m,
        }
      : { ...form, s: required(form.s, 'La source'), m };
  return { [key]: replaceRecord(snapshot[key], record) };
}

// A single source of truth for a property/tenant association, in either direction.
export function linkRecords(snapshot, propertyId, tenantId) {
  return {
    biens: snapshot.biens.map((b) =>
      b.id === propertyId
        ? { ...b, locataireId: tenantId }
        : tenantId != null && b.locataireId === tenantId
          ? { ...b, locataireId: null }
          : b,
    ),
    locataires: snapshot.locataires.map((l) =>
      l.id === tenantId
        ? { ...l, bienId: propertyId }
        : propertyId != null && l.bienId === propertyId
          ? { ...l, bienId: null }
          : l,
    ),
  };
}
export function saveProperty(snapshot, form) {
  const id = form.id || idFor(snapshot.biens);
  const tenantId = existingId(snapshot.locataires, form.locataireId);
  if (form.locataireId && tenantId === undefined) throw new Error('Ce locataire n’existe plus.');
  const record = {
    ...form,
    id,
    nom: required(form.nom, 'Le nom du bien'),
    type: required(form.type, 'Le type'),
    loyer: cleanAmount(form.loyer),
    prev: cleanAmount(form.prev),
    surf: cleanAmount(form.surf),
    num: form.num || snapshot.biens.length + 1,
  };
  const biens = form.id ? replaceRecord(snapshot.biens, record) : [...snapshot.biens, record];
  return linkRecords({ ...snapshot, biens }, id, tenantId);
}
export function saveTenant(snapshot, form) {
  const id = form.id || idFor(snapshot.locataires);
  const propertyId = existingId(snapshot.biens, form.bienId);
  if (form.bienId && propertyId === undefined) throw new Error('Ce bien n’existe plus.');
  const record = {
    ...form,
    id,
    name: required(form.name, 'Le nom'),
    rent: cleanAmount(form.rent),
    pay: form.pay ?? snapshot.locataires.find((l) => l.id === id)?.pay ?? {},
  };
  const locataires = form.id
    ? replaceRecord(snapshot.locataires, record)
    : [...snapshot.locataires, record];
  return linkRecords({ ...snapshot, locataires }, propertyId, id);
}
export function removeProperty(snapshot, id) {
  return {
    biens: snapshot.biens.filter((b) => b.id !== id),
    locataires: snapshot.locataires.map((l) => (l.bienId === id ? { ...l, bienId: null } : l)),
  };
}
export function removeTenant(snapshot, id) {
  return {
    locataires: snapshot.locataires.filter((l) => l.id !== id),
    biens: snapshot.biens.map((b) => (b.locataireId === id ? { ...b, locataireId: null } : b)),
  };
}
export function savePayment(snapshot, id, key, form) {
  if (!snapshot.locataires.some((l) => l.id === id)) throw new Error('Ce locataire n’existe plus.');
  const date = required(form.date, 'La date du paiement');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('La date du paiement n’est pas valide.');
  if (!['espece', 'cheque', 'virement'].includes(form.mode))
    throw new Error('Choisissez un mode de règlement.');
  return {
    locataires: snapshot.locataires.map((l) =>
      l.id === id
        ? {
            ...l,
            pay: { ...l.pay, [key]: { date, mode: form.mode, montant: cleanAmount(l.rent) } },
          }
        : l,
    ),
  };
}
export function removePayment(snapshot, id, key) {
  return {
    locataires: snapshot.locataires.map((l) => {
      if (l.id !== id) return l;
      const pay = { ...l.pay };
      delete pay[key];
      return { ...l, pay };
    }),
  };
}

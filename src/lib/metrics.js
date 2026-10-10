export const sum = (rows, field = 'm') =>
  rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
export function cashMetrics(data) {
  const missing = data._missingCollections || [];
  const income = missing.includes('alim') ? null : sum(data.alim);
  const expenses = missing.includes('charges') ? null : sum(data.charges);
  return {
    income,
    expenses,
    balance: income === null || expenses === null ? null : income - expenses,
  };
}
export const paidAmount = (tenant, key) => Number(tenant.pay?.[key]?.montant ?? tenant.rent) || 0;
export function rentMetrics(locataires, date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth()}`;
  const paid = locataires.filter((l) => l.pay?.[key]);
  const unpaid = locataires.filter((l) => !l.pay?.[key]);
  return {
    paid,
    unpaid,
    received: paid.reduce((total, l) => total + paidAmount(l, key), 0),
    due: sum(unpaid, 'rent'),
    total: sum(locataires, 'rent'),
    pct: locataires.length ? Math.round((paid.length / locataires.length) * 100) : 0,
  };
}
export function categoryTotals(charges) {
  const totals = new Map();
  charges.forEach((x) =>
    totals.set(x.c || 'Divers', (totals.get(x.c || 'Divers') || 0) + (Number(x.m) || 0)),
  );
  return [...totals]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

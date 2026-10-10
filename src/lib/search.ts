/** Bez wielkości liter i polskich znaków: „Masaż” znajdzie się po „masaz” */
const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();

export const matchesQuery = (text: string, query: string): boolean => {
  const q = normalize(query.trim());
  return q === '' || normalize(text).includes(q);
};

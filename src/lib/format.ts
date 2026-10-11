const money = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

/** 150.99 -> "150,99 zł" */
export const formatMoney = (amount: number): string => money.format(amount);

/** Polska odmiana liczebników: plural(2, ['rezerwacja', 'rezerwacje', 'rezerwacji']) -> 'rezerwacje' */
export const plural = (n: number, [one, few, many]: [string, string, string]): string => {
  if (n === 1) return one;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
};

/** Polski numer: 9 cyfr, opcjonalnie +48 / 0048, dowolne spacje i myślniki. Zwraca "+48XXXXXXXXX" albo null. */
export const normalizePhone = (raw: string): string | null => {
  const compact = raw.replace(/[\s\-()]/g, '');
  const match = /^(?:\+48|0048)?(\d{9})$/.exec(compact);
  return match ? `+48${match[1]}` : null;
};

/** "+48600100200" -> "600 100 200"; inne formaty bez zmian */
export const formatPhone = (phone: string): string => {
  const match = /^\+48(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : phone;
};

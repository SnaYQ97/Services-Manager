import { PaymentType } from "../../../../generated/prisma";
import { DateTime } from "luxon";

export interface ServicesDetails {
  serviceName: string;
    quantity: number;
    unitPrice: number;
}

export interface Transaction {
  id: string;
  createdAt: Date;
  totalAmount: number;
  paymentType: PaymentType;
  employee: {
    name: string;
  };
  servicesDetails?: ServicesDetails[];
  totalServicesCount?: number;
}
export type TransactionWithCategory = { label: string; items: Transaction[] };


//inicjalizacja pustej listy kategorii
let internalCategories: TransactionWithCategory[] = [];


/**
 * Główna funkcja do pobierania kategorii
 * @param transactions Lista transakcji do kategoryzacji
 * @returns Zaktualizowana lista kategorii z transakcjami
 */
export const getCategories = (transactions: Transaction[]): TransactionWithCategory[] => {
  // Resetuj kategorie na początku każdej wywołania
  internalCategories = [];

  // Przejdź przez każdą transakcję i dodaj ją do odpowiedniej kategorii
  transactions.forEach(transaction => {

    const date = new Date(transaction.createdAt);
    getDateCategory(date, transaction);
  });


  // Zwracaj aktualnie zaktualizowane kategorie
  return internalCategories;
};

/**
 * Funkcja pomocnicza do dopasowania transakcji do odpowiedniej kategorii
 * @param date Data transakcji
 * @param transaction Transakcja do kategoryzacji
 */
const getDateCategory = (date: Date, transaction: Transaction) => {
  const dateInDateTime = DateTime.fromJSDate(date);
  const now = DateTime.now();


  const diffDays = Math.floor(now.diff(dateInDateTime, 'days').days);
  const diffYears = Math.floor(now.diff(dateInDateTime, 'years').years);

  switch (true) {
    case diffDays === 0:
      addToCategory("Today", transaction);
      break;
    case diffDays === 1:
      addToCategory("Yesterday", transaction);
      break;
    case diffDays > 1 && diffDays <= 3:

      // Oblicz nazwę dnia tygodnia
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = now.weekday - 1;

      const targetIndex = (todayIndex - diffDays + 7) % 7; // Dodajemy 7, aby uniknąć ujemnych indeksów
      const weekdayLabel = weekdays[targetIndex];
      addToCategory(weekdayLabel, transaction);
      break;
    case diffYears === 0:
      // Formatuj krótką datę (np. "23 Mar")
      const shortDateLabel = dateInDateTime.toFormat('dd MMM');
      addToCategory(shortDateLabel, transaction);
      break;
    default:
      // Formatuj pełną datę (np. "23 Mar 2024")
      const fullDateLabel = dateInDateTime.toFormat('dd MMM yyyy');
      addToCategory(fullDateLabel, transaction);
      break;
  }
};

/**
 * Funkcja pomocnicza do dodawania transakcji do odpowiedniej kategorii
 * @param label Nazwa kategorii
 * @param transaction Transakcja do dodania
 */
const addToCategory = (label: string, transaction: Transaction) => {
  // Sprawdź czy kategoria istnieje
  const existingCategoryIndex = internalCategories.findIndex(c => c.label === label);

  if (existingCategoryIndex >= 0) {
    // Jeśli już istnieje, dodaj transakcję do jej listy
    internalCategories[existingCategoryIndex].items.push(transaction);
  } else {
    // Jeśli nie istnieje, utwórz nową kategorię
    const newCategory: TransactionWithCategory = {
      label,
      items: [transaction]
    };
    internalCategories.push(newCategory);
  }
};

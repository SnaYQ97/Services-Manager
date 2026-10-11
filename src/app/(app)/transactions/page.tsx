import { getTransactions } from "@/actions/transactions";
import TransactionsView, { TransactionFilterValues } from "@/components/Transactions/TransactionsView";
import { PaymentType } from "../../../../generated/prisma";

type SearchParams = { from?: string; to?: string; payment?: string; q?: string; page?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const payment = params.payment === PaymentType.CARD || params.payment === PaymentType.CASH ? params.payment : undefined;
  const filters: TransactionFilterValues = {
    from: params.from ?? '',
    to: params.to ?? '',
    payment: payment ?? 'ALL',
    q: params.q ?? '',
  };
  const data = await getTransactions({ from: params.from, to: params.to, payment, query: params.q, page: Number(params.page) || 1 });

  return <TransactionsView data={data} filters={filters} />;
}

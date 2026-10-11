import Link from "next/link";
import { LogIn } from "lucide-react";
import { getBookableServices } from "@/actions/booking";
import GuestView from "@/components/Guest/GuestView";
import ThemeToggle from "@/components/ThemeToggle";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// usługi i grafik zmieniają się w trakcie dnia – bez statycznego renderowania
export const dynamic = "force-dynamic";

export default async function GuestPage() {
  const services = await getBookableServices();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/guest" className="font-semibold tracking-tight">Service Manager</Link>
          <Badge variant="secondary">Gość</Badge>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/login"><LogIn />Zaloguj się</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Usługi i wolne terminy"
            description="Wybierz usługę, aby sprawdzić wolne terminy. Rezerwacji i płatności dokonasz w recepcji."
          />
          <GuestView services={services} />
        </div>
      </main>
    </>
  );
}

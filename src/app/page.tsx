import Service from "@/components/Service/Service";
import Statistics from "@/components/Statistics/Statistics";

export default function Home() {
  return (
    <>
      <Service />
      <Statistics />
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Some footer
      </footer>
    </>
  );
}

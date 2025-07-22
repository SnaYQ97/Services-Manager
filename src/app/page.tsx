"use client";

import Service from "@/components/Service/Service";
import Statistics from "@/components/Statistics/Statistics";
import TopBar from "@/components/TopBar/TopBar";

export default function Home() {
  return (
    <>
      <TopBar />
      <Service />
      <Statistics />
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Some footer
      </footer>
    </>
  );
}
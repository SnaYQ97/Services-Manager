"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const SearchInput = ({ value, onChange, placeholder, className }: Props) => (
  <div className={cn("relative", className)}>
    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Wyczyść wyszukiwanie"
      >
        <X className="size-3.5" />
      </button>
    )}
  </div>
);

export default SearchInput;

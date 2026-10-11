"use client";

import { initials } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  assigned?: boolean;      // wypełnione = wykonuje usługę
  onToggle?: () => void;   // tryb edycji: kliknięcie przypina/odpina
  size?: 'sm' | 'md';
}

const SpecialistAvatar = ({ name, assigned = true, onToggle, size = 'md' }: Props) => {
  const className = cn(
    'inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium transition',
    size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-[11px]',
    assigned
      ? onToggle ? 'bg-brand text-brand-foreground' : 'bg-brand-soft text-brand-soft-foreground ring-1 ring-brand/15'
      : 'border border-dashed border-muted-foreground/40 bg-background text-muted-foreground',
    onToggle && 'cursor-pointer outline-none hover:ring-2 hover:ring-brand/40 focus-visible:ring-2 focus-visible:ring-ring',
  );

  return onToggle ? (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      title={name}
      aria-pressed={assigned}
      aria-label={`${name}: ${assigned ? 'przypisany, kliknij aby odpiąć' : 'kliknij aby przypisać'}`}
    >
      {initials(name)}
    </button>
  ) : (
    <span className={className} title={name} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
};

export default SpecialistAvatar;

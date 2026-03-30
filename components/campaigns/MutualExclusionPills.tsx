"use client";

interface MutualExclusionPillsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  exclusiveOption: string;
}

export default function MutualExclusionPills({
  options,
  selected,
  onChange,
  label,
  exclusiveOption,
}: MutualExclusionPillsProps) {
  const nonExclusiveOptions = options.filter((o) => o !== exclusiveOption);

  function toggle(value: string) {
    if (value === exclusiveOption) {
      onChange([exclusiveOption]);
      return;
    }

    if (selected.includes(exclusiveOption)) {
      // Deselect exclusive, select this one
      onChange([value]);
      return;
    }

    let next: string[];
    if (selected.includes(value)) {
      next = selected.filter((s) => s !== value);
      // If nothing left, revert to exclusive
      if (next.length === 0) {
        onChange([exclusiveOption]);
        return;
      }
    } else {
      next = [...selected, value];
      // If all non-exclusive are selected, switch to exclusive
      if (nonExclusiveOptions.every((o) => next.includes(o))) {
        onChange([exclusiveOption]);
        return;
      }
    }
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={isActive}
            className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              isActive
                ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(91,91,214,0.15)]"
                : "border-border bg-card text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-muted-foreground/30 hover:text-foreground"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

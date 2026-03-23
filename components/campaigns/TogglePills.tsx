"use client";

interface TogglePillsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TogglePills({ options, selected, onChange }: TogglePillsProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-card-foreground hover:border-border hover:bg-muted"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

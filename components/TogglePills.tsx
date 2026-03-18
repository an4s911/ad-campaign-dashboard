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
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

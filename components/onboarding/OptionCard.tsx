"use client";

type OptionCardProps = {
  label: string;
  description?: string;
  selected?: boolean;
  onSelect: () => void;
};

export function OptionCard({ label, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      className="ob-option-card"
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="ob-option-label">{label}</span>
      {description ? <span className="ob-option-desc">{description}</span> : null}
    </button>
  );
}

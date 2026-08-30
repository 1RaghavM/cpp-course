"use client";

type OptionCardProps = {
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function OptionCard({ label, description, selected, disabled, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      className="ob-option-card"
      data-selected={selected || undefined}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="ob-option-label">{label}</span>
      {description ? <span className="ob-option-desc">{description}</span> : null}
    </button>
  );
}

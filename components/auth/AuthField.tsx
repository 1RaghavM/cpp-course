type AuthFieldProps = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  minLength?: number;
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  required = true,
  minLength,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-secondary">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-primary placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}

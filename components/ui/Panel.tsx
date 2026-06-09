import { ReactNode } from "react";

type PanelVariant = "surface" | "elevated" | "base";

interface PanelProps {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
  noPadding?: boolean;
}

const variantStyles: Record<PanelVariant, string> = {
  base: "bg-background",
  surface: "bg-surface",
  elevated: "bg-elevated",
};

export function Panel({
  children,
  variant = "surface",
  className = "",
  noPadding = false,
}: PanelProps) {
  return (
    <div
      className={`
        ${variantStyles[variant]}
        border border-border rounded-lg
        ${noPadding ? "" : "p-4"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  children: ReactNode;
  className?: string;
}

export function PanelHeader({ children, className = "" }: PanelHeaderProps) {
  return (
    <div
      className={`
        flex items-center justify-between
        px-4 py-3
        border-b border-border
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface PanelContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PanelContent({ children, className = "", noPadding = false }: PanelContentProps) {
  return <div className={`${noPadding ? "" : "p-4"} ${className}`}>{children}</div>;
}

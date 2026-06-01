import { type ElementType, type ComponentPropsWithoutRef } from "react";

type GlassCardProps<T extends ElementType = "div"> = {
  as?: T;
  hover?: boolean;
} & ComponentPropsWithoutRef<T>;

export function GlassCard<T extends ElementType = "div">({
  as,
  hover = true,
  className = "",
  children,
  ...rest
}: GlassCardProps<T>) {
  const Tag = as ?? "div";

  return (
    <Tag
      className={[
        "rounded-card border border-glass-border shadow-[var(--glass-shadow)]",
        "bg-[var(--glass-fill)] backdrop-blur-[var(--glass-blur)]",
        hover &&
          "transition-all duration-fast ease-smooth hover:bg-[var(--glass-fill-hi)] hover:-translate-y-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}

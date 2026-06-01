'use client';

interface Props {
  visible: boolean;
  onExplain: () => void;
}

export default function ExplainErrorButton({ visible, onExplain }: Props) {
  if (!visible) return null;

  return (
    <button
      onClick={onExplain}
      className="mx-4 mb-2 rounded-full border border-[var(--color-border-strong)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      Explain this error
    </button>
  );
}

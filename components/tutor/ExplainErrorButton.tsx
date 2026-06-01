"use client";

interface Props {
  visible: boolean;
  onExplain: () => void;
}

export default function ExplainErrorButton({ visible, onExplain }: Props) {
  if (!visible) return null;

  return (
    <button
      onClick={onExplain}
      className="mx-4 mb-2 rounded-full border border-border-subtle bg-transparent px-3 py-1.5 text-xs font-medium text-primary hover:bg-elevated transition-colors"
    >
      Explain this error
    </button>
  );
}

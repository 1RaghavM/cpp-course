"use client";

import { Button } from "@/components/ui/button";

interface Props {
  visible: boolean;
  onExplain: () => void;
}

export default function ExplainErrorButton({ visible, onExplain }: Props) {
  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onExplain}
      className="mx-4 mb-2 rounded-full"
    >
      Explain this error
    </Button>
  );
}

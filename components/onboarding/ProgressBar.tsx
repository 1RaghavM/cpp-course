type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="ob-progress">
      <span className="ob-progress-text">
        {current} / {total}
      </span>
      <div className="ob-progress-track">
        <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
